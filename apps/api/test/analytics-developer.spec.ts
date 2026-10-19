import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import {
  ApiCredentialScope,
  WebhookEvent,
} from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('M6: Public API, HMAC Webhooks & Spend Analytics (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;      // Company Owner (Horizon Sciences - Tenant 1)
  let finToken: string;        // Finance Operator (Tenant 1)
  let rahulToken: string;      // Employee (Tenant 1)
  let t2OwnerToken: string;    // Company Owner (Bluesky Retail - Tenant 2)
  let t2EmpToken: string;      // Employee (Bluesky Retail - Tenant 2)

  let createdCredentialId: string;
  let createdApiKey: string;
  let createdWebhookId: string;
  let webhookSigningSecret: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // 1. Vikram Mehta (Company Owner, Tenant 1)
    const ownerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@horizonsci.in', password: 'Password123!' });
    adminToken = ownerLogin.body.data.accessToken;

    // 2. Sarah Jenkins (Finance Operator, Tenant 1)
    const finLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'sarah.finance@horizonsci.in', password: 'Password123!' });
    finToken = finLogin.body.data.accessToken;

    // 3. Dr. Rahul Sharma (Employee, Tenant 1)
    const empLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rahul.sharma@horizonsci.in', password: 'Password123!' });
    rahulToken = empLogin.body.data.accessToken;

    // 4. Robert Chen (Company Owner, Tenant 2)
    const t2OwnerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.bluesky@blueskyretail.com', password: 'Password123!' });
    t2OwnerToken = t2OwnerLogin.body.data.accessToken;

    // 5. John Doe (Employee, Tenant 2)
    const t2EmpLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'john.bluesky@blueskyretail.com', password: 'Password123!' });
    t2EmpToken = t2EmpLogin.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ─── 1. Analytics & Financial Reporting ────────────────────────────────────

  describe('1. Analytics Engine', () => {
    it('returns spend analytics summary with breakdowns for authorized company owner', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data).toHaveProperty('totalSpend');
      expect(typeof data.totalSpend).toBe('string');
      expect(data.currency).toBe('INR');
      expect(Array.isArray(data.spendByCategory)).toBe(true);
      expect(Array.isArray(data.spendByDepartment)).toBe(true);
      expect(Array.isArray(data.spendByMonth)).toBe(true);
      expect(data.policyViolations).toHaveProperty('totalViolations');
      expect(data.reimbursementCycle).toHaveProperty('averageTotalCycleDays');
    });

    it('allows finance operator to view spend analytics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.currency).toBe('INR');
    });

    it('rejects regular employee from viewing aggregate company spend analytics (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(403);
    });

    it('exports company expense data as CSV for finance reporting', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/export/csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.text).toContain('Period,Total Amount (INR)');
    });

    it('rejects unprivileged employee from exporting analytics CSV (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/export/csv')
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 2. Developer API Credentials & M2M Auth ───────────────────────────────

  describe('2. Machine-to-Machine API Credentials', () => {
    it('creates a machine-to-machine API credential returning one-time secret', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/developer/api-credentials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'ERP Ingestion Service',
          scopes: [ApiCredentialScope.EXPENSES_READ, ApiCredentialScope.ANALYTICS_READ],
          description: 'Automated nightly sync with enterprise ledger',
          expiresInDays: 90,
        });

      expect(res.status).toBe(201);
      const data = res.body.data;

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('clientId');
      expect(data.clientId).toMatch(/^vyay_/);
      expect(data).toHaveProperty('clientSecret');
      expect(data.clientSecret).toContain(data.clientId);
      expect(data.scopes).toContain(ApiCredentialScope.ANALYTICS_READ);

      createdCredentialId = data.id;
      createdApiKey = data.clientSecret;
    });

    it('lists credentials without returning raw secrets', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/developer/api-credentials')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const creds = res.body.data;
      expect(Array.isArray(creds)).toBe(true);
      const found = creds.find((c: any) => c.id === createdCredentialId);
      expect(found).toBeDefined();
      expect(found).not.toHaveProperty('clientSecret');
      expect(found).not.toHaveProperty('clientSecretHash');
    });

    it('authenticates successfully using the API Key via X-API-Key header (M2M)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('X-API-Key', createdApiKey);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalSpend');
    });

    it('rejects tampered or invalid API Key (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('X-API-Key', `${createdApiKey}_tampered`);

      expect(res.status).toBe(401);
    });

    it('rejects regular employee from creating API credentials (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/developer/api-credentials')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          name: 'Unauthorized Key',
          scopes: [ApiCredentialScope.ADMIN],
        });

      expect(res.status).toBe(403);
    });

    it('revokes an API credential and prevents subsequent access (401)', async () => {
      const revokeRes = await request(app.getHttpServer())
        .delete(`/api/v1/developer/api-credentials/${createdCredentialId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(revokeRes.status).toBe(204);

      // Now attempt to use the revoked key
      const postRevokeRes = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('X-API-Key', createdApiKey);

      expect(postRevokeRes.status).toBe(401);
    });
  });

  // ─── 3. HMAC Webhook Dispatcher ─────────────────────────────────────────────

  describe('3. Webhooks & HMAC Signature Dispatching', () => {
    it('creates a webhook endpoint subscription returning the signing secret', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/developer/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          url: 'https://webhook.site/horizon-finance-sink',
          events: [
            WebhookEvent.REPORT_APPROVED,
            WebhookEvent.REIMBURSEMENT_PAID,
            WebhookEvent.INTEGRATION_SYNCED,
          ],
          description: 'Horizon Finance Automation Webhook',
          active: true,
        });

      expect(res.status).toBe(201);
      const data = res.body.data;
      expect(data).toHaveProperty('id');
      expect(data.url).toBe('https://webhook.site/horizon-finance-sink');
      expect(data.events).toHaveLength(3);
      expect(data).toHaveProperty('signingKey');
      expect(data).toHaveProperty('signingKeyHint');
      expect(data.signingKey.length).toBe(64); // 32-byte hex string

      createdWebhookId = data.id;
      webhookSigningSecret = data.signingKey;
    });

    it('lists registered webhook subscriptions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/developer/webhooks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const list = res.body.data;
      expect(Array.isArray(list)).toBe(true);
      const found = list.find((s: any) => s.id === createdWebhookId);
      expect(found).toBeDefined();
      expect(found.active).toBe(true);
    });

    it('rotates signing key for webhook subscription', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/developer/webhooks/${createdWebhookId}/rotate-key`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data).toHaveProperty('newSigningKey');
      expect(data.newSigningKey).not.toBe(webhookSigningSecret);
      webhookSigningSecret = data.newSigningKey;
    });

    it('dispatches a test event and records delivery logs with HMAC verification', async () => {
      const dispatchRes = await request(app.getHttpServer())
        .post('/api/v1/developer/webhooks/test-dispatch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          event: WebhookEvent.REIMBURSEMENT_PAID,
          data: {
            reimbursementId: 'reimb-test-001',
            amount: 14500,
            currency: 'INR',
          },
        });

      expect(dispatchRes.status).toBe(200);
      expect(dispatchRes.body.data.dispatched).toBe(true);

      // Verify delivery log recorded
      const logsRes = await request(app.getHttpServer())
        .get(`/api/v1/developer/webhooks/${createdWebhookId}/deliveries`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(logsRes.status).toBe(200);
      const logs = logsRes.body.data;
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      const latest = logs[logs.length - 1];
      expect(latest.event).toBe(WebhookEvent.REIMBURSEMENT_PAID);
      expect(latest.success).toBe(true);
      expect(latest.httpStatus).toBe(200);
    });

    it('rejects regular employee from managing webhooks (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/developer/webhooks')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          url: 'https://evil.site/capture',
          events: [WebhookEvent.EXPENSE_CREATED],
        });

      expect(res.status).toBe(403);
    });
  });

  // ─── 4. Multi-Tenant Security Isolation ─────────────────────────────────────

  describe('4. Multi-Tenant Boundary Enforcement', () => {
    it('prevents Tenant 2 admin from accessing Tenant 1 webhook (404)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/developer/webhooks/${createdWebhookId}`)
        .set('Authorization', `Bearer ${t2OwnerToken}`);

      expect(res.status).toBe(404);
    });

    it('prevents Tenant 2 admin from rotating Tenant 1 webhook key (404)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/developer/webhooks/${createdWebhookId}/rotate-key`)
        .set('Authorization', `Bearer ${t2OwnerToken}`);

      expect(res.status).toBe(404);
    });

    it('rejects unprivileged Tenant 2 employee from managing developer endpoints (403)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/developer/webhooks/${createdWebhookId}`)
        .set('Authorization', `Bearer ${t2EmpToken}`);

      expect(res.status).toBe(403);
    });

    it('blocks tenant spoofing via X-Tenant-ID header (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', 'tenant-0000-0000-0000-000000000002');

      expect(res.status).toBe(403);
    });
  });
});
