import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Role, ReportStatus, ReimbursementStatus, PaymentMethod, TaxTreatment } from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('M4: Finance Review, GL Mappings & Partial Reimbursements (e2e)', () => {
  let app: INestApplication;
  let rahulToken: string; // Employee (Claimant)
  let anitaToken: string; // Manager
  let adminToken: string; // Company Owner
  let finToken: string;   // Finance Operator (Disburser)
  let t2Token: string;    // Tenant 2 user (Cross-tenant probing)

  let activeReimbursementId: string;
  const standardReportId = 'rep-001'; // Seeded baseline report

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Pre-Payment Finance Review & Compliance Verification', () => {
    it('Step 4.1: Finance Operator retrieves approved claims review queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/review-queue')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const target = res.body.data.find((item: any) => item.reportId === standardReportId);
      expect(target).toBeDefined();
      expect(target.currency).toBe('INR');
      expect(target.status).toBe(ReportStatus.APPROVED);
    });

    it('Step 4.2: Finance Operator performs pre-payment audit verification', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/finance/reports/${standardReportId}/validate`)
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          documentationVerified: true,
          glAccountsVerified: true,
          taxTreatmentVerified: true,
          remarks: 'Verified vendor GSTIN invoice and ITC eligibility u/s 16 CGST Act.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.documentationVerified).toBe(true);
      expect(res.body.data.glAccountsVerified).toBe(true);
      expect(res.body.data.taxTreatmentVerified).toBe(true);
      expect(res.body.data.remarks).toContain('ITC eligibility');
    });
  });

  describe('GL Account Coding, Tax Treatments & Ledger Preview', () => {
    it('Step 4.3: Retrieve category to GL account code mappings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/finance/gl-mappings')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const airfare = res.body.data.find((m: any) => m.categoryId === 'cat-air-travel');
      expect(airfare).toBeDefined();
      expect(airfare.glCode).toBe('6010');
      expect(airfare.taxTreatment).toBe(TaxTreatment.ITC_ELIGIBLE);

      const meals = res.body.data.find((m: any) => m.categoryId === 'cat-client-meals');
      expect(meals).toBeDefined();
      expect(meals.taxTreatment).toBe(TaxTreatment.ITC_INELIGIBLE);
    });

    it('Step 4.4: Update GL mapping for software subscription category', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/finance/gl-mappings/cat-software-lic')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          glCode: '6055',
          glAccountName: 'Software Subscription & SaaS Tools',
          taxTreatment: TaxTreatment.RCM_APPLICABLE,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.glCode).toBe('6055');
      expect(res.body.data.glAccountName).toBe('Software Subscription & SaaS Tools');
      expect(res.body.data.taxTreatment).toBe(TaxTreatment.RCM_APPLICABLE);
    });

    it('Step 4.5: Preview balanced double-entry accounting ledger impact', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/finance/ledger-preview/${standardReportId}`)
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.balanced).toBe(true);
      expect(res.body.data.debits.length).toBeGreaterThan(0);
      expect(res.body.data.credits.length).toBeGreaterThan(0);

      // Verify Credit is to Accounts Payable / Employee Reimbursements Payable
      const payableCredit = res.body.data.credits.find((c: any) => c.accountCode === '2010');
      expect(payableCredit).toBeDefined();
      expect(payableCredit.type).toBe('CURRENT_LIABILITY');
    });

    it('Step 4.6: Budget management and ceiling configuration', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/finance/budgets')
        .set('Authorization', `Bearer ${finToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/finance/budgets')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          name: 'Q4 Field Trials & Partner Travel',
          period: 'QUARTERLY',
          limitAmount: '120000.00',
          currency: 'INR',
          targetType: 'DEPARTMENT',
          targetId: '99999999-9999-9999-9999-999999999999',
          targetName: 'Quality Assurance',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.limitAmount).toBe('120000.00');
      expect(createRes.body.data.remainingAmount).toBe('120000.00');
    });
  });

  describe('Reimbursements, Partial Installments & Anti-Fraud Payout Gates', () => {
    it('Step 4.7: Query reimbursements list shows approved claim in ELIGIBLE status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/reimbursements')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const reimb = res.body.data.find((r: any) => r.reportId === standardReportId);
      expect(reimb).toBeDefined();
      expect(reimb.status).toBe(ReimbursementStatus.ELIGIBLE);
      expect(reimb.eligibleAmount).toBe('8450.00');
      expect(reimb.paidAmount).toBe('0.00');
      expect(reimb.remainingAmount).toBe('8450.00');
      expect(reimb.payments.length).toBe(0);

      activeReimbursementId = reimb.id;
    });

    it('Step 4.8: NEGATIVE TEST: Employee Rahul is BLOCKED from recording reimbursement payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reimbursements/${activeReimbursementId}/payments`)
        .set('Authorization', `Bearer ${rahulToken}`) // Non-finance role
        .send({
          amount: '8450.00',
          method: PaymentMethod.BANK_TRANSFER,
          transactionRef: 'FAKE-TXN-123',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Permission denied');
    });

    it('Step 4.9: NEGATIVE TEST: Cross-tenant probing is blocked by tenant guard', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reimbursements/${activeReimbursementId}/payments`)
        .set('Authorization', `Bearer ${t2Token}`) // Tenant 2 user
        .send({
          amount: '1000.00',
          method: PaymentMethod.BANK_TRANSFER,
          transactionRef: 'T2-PROBE-TXN',
        });

      expect([403, 404]).toContain(res.status);
    });

    it('Step 4.10: NEGATIVE TEST: Payout exceeding remaining eligible balance is rejected (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reimbursements/${activeReimbursementId}/payments`)
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          amount: '9000.00', // Exceeds 8450.00
          method: PaymentMethod.BANK_TRANSFER,
          transactionRef: 'OVERPAY-TXN-001',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds remaining eligible balance');
    });

    it('Step 4.11: First partial disbursement installment records accurately (₹3,450.00)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reimbursements/${activeReimbursementId}/payments`)
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          amount: '3450.00',
          method: PaymentMethod.BANK_TRANSFER,
          transactionRef: 'UTR-2026-NEFT-984102',
          payerBankAccount: 'HDFC Corporate Operating A/C ****4091',
          notes: 'First installment disbursed via NEFT batch #4401.',
        });

      expect(res.status).toBe(200);
      const reimb = res.body.data.reimbursement;
      expect(reimb.status).toBe(ReimbursementStatus.PARTIALLY_PAID);
      expect(reimb.paidAmount).toBe('3450.00');
      expect(reimb.remainingAmount).toBe('5000.00'); // 8450.00 - 3450.00
      expect(reimb.payments.length).toBe(1);

      const payment = res.body.data.payment;
      expect(payment.amount).toBe('3450.00');
      expect(payment.transactionRef).toBe('UTR-2026-NEFT-984102');
      expect(payment.payerBankAccount).toContain('HDFC Corporate');
    });

    it('Step 4.12: NEGATIVE TEST: Anti-duplicate payout gate blocks duplicate transaction reference', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reimbursements/${activeReimbursementId}/payments`)
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          amount: '2000.00',
          method: PaymentMethod.BANK_TRANSFER,
          transactionRef: 'UTR-2026-NEFT-984102', // Duplicate reference
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Duplicate payment reference');
    });

    it('Step 4.13: Final installment payment settles balance to ₹0.00 and marks claim PAID', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reimbursements/${activeReimbursementId}/payments`)
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          amount: '5000.00', // Clears remaining 5000.00
          method: PaymentMethod.BANK_TRANSFER,
          transactionRef: 'UTR-2026-IMPS-771923',
          payerBankAccount: 'HDFC Corporate Operating A/C ****4091',
          notes: 'Final installment cleared.',
        });

      expect(res.status).toBe(200);
      const reimb = res.body.data.reimbursement;
      expect(reimb.status).toBe(ReimbursementStatus.PAID);
      expect(reimb.paidAmount).toBe('8450.00');
      expect(reimb.remainingAmount).toBe('0.00');
      expect(reimb.payments.length).toBe(2);

      // Verify associated report is now synchronized to PAID
      const rep = await request(app.getHttpServer())
        .get(`/api/v1/reports/${standardReportId}`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(rep.body.data.reimbursementStatus).toBe(ReimbursementStatus.PAID);
    });
  });
});
