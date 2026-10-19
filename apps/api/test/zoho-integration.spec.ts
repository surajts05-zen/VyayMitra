import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ZohoRegion, PostingStatus } from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { IntegrationsService } from '../src/modules/integrations/integrations.service.js';

describe('M5: Zoho Books Live Integration & Reusable Connector Architecture (e2e)', () => {
  let app: INestApplication;
  let integrationsService: IntegrationsService;

  let finToken: string;   // Finance Operator (Tenant 1)
  let adminToken: string; // Company Owner (Tenant 1)
  let empToken: string;   // Regular Employee (Tenant 1)
  let t2Token: string;    // Tenant 2 user (Cross-tenant probing)

  const tenant1Id = '11111111-1111-1111-1111-111111111111';
  const tenant2Id = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    integrationsService = app.get(IntegrationsService);

    // 1. Sarah Jenkins (Finance Operator, Tenant 1)
    const finLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'sarah.finance@horizonsci.in', password: 'Password123!' });
    finToken = finLogin.body.data.accessToken;

    // 2. Vikram Mehta (Company Owner, Tenant 1)
    const ownerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@horizonsci.in', password: 'Password123!' });
    adminToken = ownerLogin.body.data.accessToken;

    // 3. Dr. Rahul Sharma (Employee, Tenant 1)
    const empLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'rahul.sharma@horizonsci.in', password: 'Password123!' });
    empToken = empLogin.body.data.accessToken;

    // 4. John Doe (Employee, Tenant 2)
    const t2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'john.bluesky@blueskyretail.com', password: 'Password123!' });
    t2Token = t2Login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Connection Health & Diagnostics', () => {
    it('should report healthy connected status for configured Tenant 1', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/health')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.connected).toBe(true);
      expect(res.body.data.provider).toBe('zoho_books');
      expect(res.body.data.externalOrgName).toContain('Acme BioTech India Pvt Ltd');
    });

    it('should report disconnected/unconfigured status for Tenant 2', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/health')
        .set('Authorization', `Bearer ${t2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.connected).toBe(false);
      expect(res.body.data.error).toContain('Connection not configured');
    });
  });

  describe('2. Regional OAuth Authorization URL Generation', () => {
    it('should generate region-specific auth URL for India (IN) by default', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/auth-url?region=IN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.authUrl).toContain('accounts.zoho.in/oauth/v2/auth');
      expect(res.body.data.authUrl).toContain('access_type=offline');
      expect(res.body.data.authUrl).toContain('ZohoBooks.expenses.ALL');
      expect(res.body.data.state).toBeDefined();
    });

    it('should generate region-specific auth URL for US and EU', async () => {
      const resUS = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/auth-url?region=US')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resUS.body.data.authUrl).toContain('accounts.zoho.com');

      const resEU = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/auth-url?region=EU')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resEU.body.data.authUrl).toContain('accounts.zoho.eu');
    });
  });

  describe('3. OAuth Token Exchange Callback & Disconnect', () => {
    it('should exchange authorization code for tokens and connect', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/callback')
        .set('Authorization', `Bearer ${t2Token}`)
        .send({
          code: '1000.sample_auth_code_tenant2',
          state: 'state_t2_xyz',
          region: ZohoRegion.IN,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONNECTED');
      expect(res.body.data.integrationId).toBeDefined();

      // Check health now reports connected for Tenant 2
      const healthRes = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/health')
        .set('Authorization', `Bearer ${t2Token}`);
      expect(healthRes.body.data.connected).toBe(true);
    });

    it('should disconnect and clear credentials cleanly', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/disconnect')
        .set('Authorization', `Bearer ${t2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      const healthRes = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/health')
        .set('Authorization', `Bearer ${t2Token}`);
      expect(healthRes.body.data.connected).toBe(false);
    });
  });

  describe('4. Reference Data Discovery & Organization Selection', () => {
    it('should list available Zoho Books organizations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/organizations')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Acme BioTech');
    });

    it('should select active organization', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/select-org')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          orgId: 'zoho-org-891240',
          orgName: 'Acme BioTech India Pvt Ltd (Primary)',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.externalOrgId).toBe('zoho-org-891240');
    });

    it('should fetch Chart of Accounts, GST taxes, vendors, and projects', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/reference-data')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      const { accounts, taxes, vendors, projects } = res.body.data;
      expect(accounts.length).toBeGreaterThan(0);
      expect(taxes.length).toBeGreaterThan(0);
      expect(vendors.length).toBeGreaterThan(0);
      expect(projects.length).toBeGreaterThan(0);

      // Verify Chart of Account structure
      const travelAccount = accounts.find((a: any) => a.code === '6010');
      expect(travelAccount).toBeDefined();
      expect(travelAccount.name).toBe('Travel & Conveyance');

      // Verify GST Tax Code structure
      const gst18 = taxes.find((t: any) => t.rate === '18.0');
      expect(gst18).toBeDefined();
    });
  });

  describe('5. External Mappings Management', () => {
    it('should get current external mappings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/mappings')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should batch update category-to-GL account mappings', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/integrations/zoho/mappings')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          mappings: [
            {
              localType: 'CATEGORY',
              localId: 'cat-scientific-supplies',
              externalType: 'CHART_OF_ACCOUNT',
              externalId: 'zoho-acc-5010',
              externalName: 'Direct Scientific Consumables',
            },
          ],
        });

      expect(res.status).toBe(200);
      const suppliesMapping = res.body.data.find(
        (m: any) => m.localId === 'cat-scientific-supplies'
      );
      expect(suppliesMapping).toBeDefined();
      expect(suppliesMapping.externalId).toBe('zoho-acc-5010');
    });
  });

  describe('6. Dry-Run Validation & Pre-Posting Previews', () => {
    it('should perform dry-run preview and return validation results', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/dry-run')
        .set('Authorization', `Bearer ${finToken}`)
        .send({ reportId: 'rep-001' });

      expect(res.status).toBe(200);
      expect(res.body.data.reportId).toBe('rep-001');
      expect(res.body.data.allMapped).toBe(true);
      expect(res.body.data.dryRunValidated).toBe(true);
      expect(res.body.data.lines.length).toBeGreaterThan(0);
      expect(res.body.data.validationMessages.length).toBeGreaterThan(0);
    });
  });

  describe('7. Live Bill Export & Idempotency Enforcement', () => {
    const testReportId = 'rep-m5-export-101';

    it('should post report to Zoho Books as a Bill and return remote reference', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/export')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          reportId: testReportId,
          exportMode: 'BILL',
          dryRun: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(PostingStatus.SYNCED);
      expect(res.body.data.remoteReference).toBeDefined();
      expect(res.body.data.remoteReference).toContain('zb_bill_');
      expect(res.body.data.jobId).toBeDefined();
    });

    it('should strictly guarantee idempotency on duplicate export', async () => {
      // Re-posting the exact same report must return cached record and NOT create duplicate remote bills
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/export')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          reportId: testReportId,
          exportMode: 'BILL',
          dryRun: false,
        });

      expect(res1.status).toBe(200);
      expect(res1.body.data.status).toBe(PostingStatus.SYNCED);
      expect(res1.body.data.message).toContain('already exported');
    });

    it('should record export jobs in integration sync history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/jobs')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const job = res.body.data.find((j: any) => j.entityId === testReportId);
      expect(job).toBeDefined();
      expect(job.status).toBe(PostingStatus.SYNCED);
    });
  });

  describe('8. Upstream 429 Rate Limit Backoff Handling', () => {
    it('should catch 429 rate limit and inform with retry-after backoff', async () => {
      integrationsService.setConnectorFailureMode(tenant1Id, '429_RATE_LIMIT');

      const res = await request(app.getHttpServer())
        .post('/api/v1/integrations/zoho/export')
        .set('Authorization', `Bearer ${finToken}`)
        .send({
          reportId: 'rep-m5-rate-limit-check',
          exportMode: 'BILL',
          dryRun: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('rate limit exceeded');

      // Reset connector failure mode
      integrationsService.setConnectorFailureMode(tenant1Id, 'NONE');
    });
  });

  describe('9. Multi-Tenant Isolation & Role Protection', () => {
    it('should deny unauthenticated requests to integrations API', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/health');

      expect(res.status).toBe(401);
    });

    it('should prevent Tenant 2 from accessing Tenant 1 mappings or jobs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/integrations/zoho/jobs')
        .set('Authorization', `Bearer ${t2Token}`);

      expect(res.status).toBe(200);
      // Tenant 2 has no jobs
      expect(res.body.data.length).toBe(0);
    });
  });
});
