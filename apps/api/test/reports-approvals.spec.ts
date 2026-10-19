import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Role, ReportStatus, ReimbursementStatus, ApprovalDecision } from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('M3: Reports, Policy Engine & Multi-Stage Approvals (e2e)', () => {
  let app: INestApplication;
  let rahulToken: string; // Employee (Submitter)
  let anitaToken: string; // Manager (Direct Approver)
  let adminToken: string; // Company Owner (Escalation Approver)
  let finToken: string;   // Finance Operator
  let t2Token: string;    // Tenant 2 user (Cross-tenant probing)

  let createdExpense1Id: string;
  let createdExpense2Id: string;
  let highValueExpenseId: string;

  let standardReportId: string;
  let highValueReportId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // 1. Dr. Rahul Sharma (Employee, Tenant 1)
    const empLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rahul.sharma@horizonsci.in', password: 'Password123!' });
    rahulToken = empLogin.body.data.accessToken;

    // 2. Anita Deshmukh (Manager, Tenant 1)
    const mgrLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'manager.anita@horizonsci.in', password: 'Password123!' });
    anitaToken = mgrLogin.body.data.accessToken;

    // 3. Vikram Mehta (Company Owner, Tenant 1)
    const ownerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@horizonsci.in', password: 'Password123!' });
    adminToken = ownerLogin.body.data.accessToken;

    // 4. Sarah Jenkins (Finance Operator, Tenant 1)
    const finLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'sarah.finance@horizonsci.in', password: 'Password123!' });
    finToken = finLogin.body.data.accessToken;

    // 5. John Doe (Employee, Tenant 2)
    const t2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'john.bluesky@blueskyretail.com', password: 'Password123!' });
    t2Token = t2Login.body.data.accessToken;

    // Create seed expenses for Rahul
    const exp1 = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${rahulToken}`)
      .send({
        merchant: 'Air India Flights',
        spentAt: '2026-10-15T08:00:00.000Z',
        currency: 'INR',
        amount: '8500.000000',
        categoryId: '00000000-0000-0000-0000-000000000001',
        businessPurpose: 'BLR-DEL flight for client conference',
        reimbursable: true,
      });
    createdExpense1Id = exp1.body.data.id;

    const exp2 = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${rahulToken}`)
      .send({
        merchant: 'The Oberoi New Delhi',
        spentAt: '2026-10-16T12:00:00.000Z',
        currency: 'INR',
        amount: '6500.000000',
        categoryId: '00000000-0000-0000-0000-000000000001',
        businessPurpose: 'Client dinner and delegates accommodation',
        reimbursable: true,
      });
    createdExpense2Id = exp2.body.data.id;

    // High value expense (>50,000 INR) to test escalation policy
    const expHigh = await request(app.getHttpServer())
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${rahulToken}`)
      .send({
        merchant: 'Agilent Technologies Singapore',
        spentAt: '2026-10-17T10:00:00.000Z',
        currency: 'INR',
        amount: '65000.000000',
        categoryId: '00000000-0000-0000-0000-000000000001',
        businessPurpose: 'High throughput chromatography column consumables',
        reimbursable: true,
      });
    highValueExpenseId = expHigh.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Report Creation, Assembly & Total Arithmetic', () => {
    it('Step 3.1: Assemble multiple draft expenses into an Expense Report', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          title: 'Delhi Client Summit & Tech Review',
          businessPurpose: 'Attendance at scientific delegation & client presentation',
          expenseIds: [createdExpense1Id, createdExpense2Id],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(ReportStatus.DRAFT);
      expect(res.body.data.totalAmount).toBe('15000.000000'); // 8500 + 6500 = 15000 exact
      expect(res.body.data.reimbursableAmount).toBe('15000.000000');
      expect(res.body.data.expenseCount).toBe(2);
      standardReportId = res.body.data.id;
    });

    it('Step 3.2: Prevent attaching an expense already assigned to another report', async () => {
      // First submit standardReport to lock expenses
      await request(app.getHttpServer())
        .post(`/api/v1/reports/${standardReportId}/submit`)
        .set('Authorization', `Bearer ${rahulToken}`);

      const res = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          title: 'Conflicting Expense Report',
          businessPurpose: 'Should be rejected because expense1 is locked',
          expenseIds: [createdExpense1Id],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already attached');
    });

    it('Step 3.3: High-value claim triggers policy escalation threshold (>₹50,000)', async () => {
      const repRes = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          title: 'Agilent Chromatography Consumables',
          businessPurpose: 'Critical laboratory supplies import',
          expenseIds: [highValueExpenseId],
        });
      highValueReportId = repRes.body.data.id;

      const subRes = await request(app.getHttpServer())
        .post(`/api/v1/reports/${highValueReportId}/submit`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(subRes.status).toBe(200);
      expect(subRes.body.data.report.status).toBe(ReportStatus.SUBMITTED);
      expect(subRes.body.data.policyViolations.length).toBeGreaterThan(0);
      expect(subRes.body.data.policyViolations[0].ruleType).toBe('AMOUNT_THRESHOLD_ESCALATION');

      // Verifying 3 steps created: Manager -> Executive Escalation -> Finance Review
      const steps = subRes.body.data.approvalFlow;
      expect(steps.length).toBe(3);
      expect(steps[0].stepName).toContain('Manager');
      expect(steps[1].stepName).toContain('Executive Escalation');
      expect(steps[2].stepName).toContain('Finance');
    });
  });

  describe('Multi-Stage Approval Routing & Self-Approval Prevention', () => {
    let standardManagerStepId: string;

    it('Step 3.4: Manager Anita receives standard report in approval inbox', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/approvals/inbox')
        .set('Authorization', `Bearer ${anitaToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const targetStep = res.body.data.find((s: any) => s.reportId === standardReportId);
      expect(targetStep).toBeDefined();
      expect(targetStep.stepName).toBe('Manager Approval');
      standardManagerStepId = targetStep.id;
    });

    it('Step 3.5: NEGATIVE TEST: Submitter Rahul is BLOCKED from approving his own report', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/approvals/${standardManagerStepId}/decide`)
        .set('Authorization', `Bearer ${rahulToken}`) // Submitter attempting approval
        .send({
          decision: ApprovalDecision.APPROVED,
          comment: 'Approving my own expenses',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Self-approval is strictly forbidden');
    });

    it('Step 3.6: Unauthorized third party is blocked from deciding on step', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/approvals/${standardManagerStepId}/decide`)
        .set('Authorization', `Bearer ${t2Token}`) // Tenant 2 user
        .send({
          decision: ApprovalDecision.APPROVED,
        });

      expect(res.status).toBe(404); // Scoped out cleanly by tenant guard
    });

    it('Step 3.7: Rejection or changes-requested requires descriptive comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/approvals/${standardManagerStepId}/decide`)
        .set('Authorization', `Bearer ${anitaToken}`)
        .send({
          decision: ApprovalDecision.CHANGES_REQUESTED,
          comment: '', // Missing comment
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('mandatory when requesting changes');
    });

    it('Step 3.8: Manager requests changes, unlocking expenses for employee correction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/approvals/${standardManagerStepId}/decide`)
        .set('Authorization', `Bearer ${anitaToken}`)
        .send({
          decision: ApprovalDecision.CHANGES_REQUESTED,
          comment: 'Please split hotel accommodation from personal meals.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.step.status).toBe('CHANGES_REQUESTED');

      // Verify report status is CHANGES_REQUESTED
      const rep = await request(app.getHttpServer())
        .get(`/api/v1/reports/${standardReportId}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(rep.body.data.status).toBe(ReportStatus.CHANGES_REQUESTED);

      // Verify employee can resubmit after addressing comments
      const resubmitRes = await request(app.getHttpServer())
        .post(`/api/v1/reports/${standardReportId}/submit`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(resubmitRes.status).toBe(200);
      expect(resubmitRes.body.data.report.status).toBe(ReportStatus.SUBMITTED);
    });
  });

  describe('Out-of-Office Delegation Engine', () => {
    let delegatedStepId: string;
    let delegateUserId: string;

    it('Step 3.9: Prevent self-delegation (400 Bad Request)', async () => {
      const anitaProfile = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${anitaToken}`);

      const res = await request(app.getHttpServer())
        .post('/api/v1/approvals/delegations')
        .set('Authorization', `Bearer ${anitaToken}`)
        .send({
          delegateUserId: anitaProfile.body.data.userId, // Self delegation
          scope: 'ALL',
          effectiveFrom: new Date().toISOString(),
          effectiveUntil: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Self-delegation is prohibited');
    });

    it('Step 3.10: Manager delegates approval authority to Sarah Jenkins during leave', async () => {
      const finProfile = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${finToken}`);
      delegateUserId = finProfile.body.data.userId;

      const res = await request(app.getHttpServer())
        .post('/api/v1/approvals/delegations')
        .set('Authorization', `Bearer ${anitaToken}`)
        .send({
          delegateUserId,
          scope: 'ALL',
          effectiveFrom: new Date(Date.now() - 3600000).toISOString(), // Active since 1 hour ago
          effectiveUntil: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days
          reason: 'Annual Scientific Leave delegation',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.active).toBe(true);
      expect(res.body.data.delegatorName).toContain('Anita');
    });

    it('Step 3.11: Active delegate Sarah can view and approve Anita pending step', async () => {
      // Refresh inbox for standard report
      const rep = await request(app.getHttpServer())
        .get(`/api/v1/reports/${standardReportId}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      const pendingStep = rep.body.data.approvalSteps.find((s: any) => s.status === 'PENDING');
      expect(pendingStep).toBeDefined();
      delegatedStepId = pendingStep.id;

      // Sarah approves as authorized delegate
      const res = await request(app.getHttpServer())
        .post(`/api/v1/approvals/${delegatedStepId}/decide`)
        .set('Authorization', `Bearer ${finToken}`) // Acting as delegate
        .send({
          decision: ApprovalDecision.APPROVED,
          comment: 'Approved on behalf of Anita Deshmukh (Out of Office)',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.step.status).toBe('APPROVED');
      expect(res.body.data.step.delegatedFrom).toBeDefined();
    });

    it('Step 3.12: Completing all steps marks report APPROVED and reimbursement ELIGIBLE', async () => {
      // Standard report had 2 steps: Manager and Finance
      // Let's check remaining step
      const rep = await request(app.getHttpServer())
        .get(`/api/v1/reports/${standardReportId}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      const nextStep = rep.body.data.approvalSteps.find((s: any) => s.status === 'PENDING');
      if (nextStep) {
        // Sarah approves final Finance step
        const finApprove = await request(app.getHttpServer())
          .post(`/api/v1/approvals/${nextStep.id}/decide`)
          .set('Authorization', `Bearer ${finToken}`)
          .send({
            decision: ApprovalDecision.APPROVED,
            comment: 'Finance review complete and validated against policy.',
          });
        expect(finApprove.status).toBe(200);
      }

      // Check final report status
      const finalRep = await request(app.getHttpServer())
        .get(`/api/v1/reports/${standardReportId}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(finalRep.body.data.status).toBe(ReportStatus.APPROVED);
      expect(finalRep.body.data.reimbursementStatus).toBe(ReimbursementStatus.ELIGIBLE);
    });
  });
});
