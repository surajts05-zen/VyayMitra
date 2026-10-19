import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PostingStatus, TallyVoucherType } from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Multi-Accounting Integrations (Zoho Books, Xero, Tally Prime) e2e', () => {
  let app: INestApplication;
  let finToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    const finLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'sarah.finance@horizonsci.in', password: 'Password123!' });
    finToken = finLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. should list supported accounting providers (Zoho, Xero, Tally Prime)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/integrations/providers')
      .set('Authorization', `Bearer ${finToken}`)
      .expect(200);

    const providers = res.body.data;
    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBe(3);
    const ids = providers.map((p: any) => p.id);
    expect(ids).toContain('zoho_books');
    expect(ids).toContain('xero');
    expect(ids).toContain('tally_prime');
  });

  it('2. should verify Xero health check and reference data', async () => {
    const healthRes = await request(app.getHttpServer())
      .get('/api/v1/integrations/xero/health')
      .set('Authorization', `Bearer ${finToken}`)
      .expect(200);

    expect(healthRes.body.data.connected).toBe(true);
    expect(healthRes.body.data.provider).toBe('xero');

    const refRes = await request(app.getHttpServer())
      .get('/api/v1/integrations/xero/reference-data')
      .set('Authorization', `Bearer ${finToken}`)
      .expect(200);

    expect(refRes.body.data.accounts.length).toBeGreaterThan(0);
    expect(refRes.body.data.taxes.length).toBeGreaterThan(0);
  });

  it('3. should verify Tally Prime health check and Master Ledgers', async () => {
    const healthRes = await request(app.getHttpServer())
      .get('/api/v1/integrations/tally_prime/health')
      .set('Authorization', `Bearer ${finToken}`)
      .expect(200);

    expect(healthRes.body.data.connected).toBe(true);
    expect(healthRes.body.data.provider).toBe('tally_prime');

    const refRes = await request(app.getHttpServer())
      .get('/api/v1/integrations/tally_prime/reference-data')
      .set('Authorization', `Bearer ${finToken}`)
      .expect(200);

    expect(refRes.body.data.accounts.some((a: any) => a.name === 'Travelling Expenses')).toBe(true);
  });

  it('4. should dry-run posting to Xero and Tally Prime', async () => {
    const xeroDryRun = await request(app.getHttpServer())
      .post('/api/v1/integrations/xero/dry-run')
      .set('Authorization', `Bearer ${finToken}`)
      .send({ reportId: 'rep-dryrun-01' })
      .expect(200);

    expect(xeroDryRun.body.data.allMapped).toBe(true);

    const tallyDryRun = await request(app.getHttpServer())
      .post('/api/v1/integrations/tally_prime/dry-run')
      .set('Authorization', `Bearer ${finToken}`)
      .send({ reportId: 'rep-dryrun-01' })
      .expect(200);

    expect(tallyDryRun.body.data.allMapped).toBe(true);
  });

  it('5. should export report to Xero and return remote invoice reference', async () => {
    const exportRes = await request(app.getHttpServer())
      .post('/api/v1/integrations/xero/export')
      .set('Authorization', `Bearer ${finToken}`)
      .send({ reportId: 'rep-xero-exp-01', exportMode: 'BILL', dryRun: false })
      .expect(200);

    expect(exportRes.body.data.status).toBe(PostingStatus.SYNCED);
    expect(exportRes.body.data.remoteReference).toBeDefined();
    expect(exportRes.body.data.remoteReference).toContain('xero_inv');
  });

  it('6. should generate Tally Prime XML voucher', async () => {
    const xmlRes = await request(app.getHttpServer())
      .post('/api/v1/integrations/tally/xml-voucher')
      .set('Authorization', `Bearer ${finToken}`)
      .send({
        reportId: 'rep-tally-exp-01',
        companyName: 'Horizon Scientific India Pvt Ltd',
        voucherType: TallyVoucherType.PAYMENT,
        cashBankLedger: 'HDFC Bank Current A/c',
        directSync: false,
      })
      .expect(200);

    expect(xmlRes.body.data.status).toBe(PostingStatus.SYNCED);
    expect(xmlRes.body.data.xmlContent).toContain('<ENVELOPE>');
    expect(xmlRes.body.data.xmlContent).toContain('<VOUCHER VCHTYPE="Payment"');
    expect(xmlRes.body.data.voucherNumber).toContain('VM-TALLY');
  });
});
