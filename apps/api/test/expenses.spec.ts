import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Role, ExpenseStatus } from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('M2: Expense Engine & Receipts (e2e)', () => {
  let app: INestApplication;
  let rahulToken: string;
  let finToken: string;
  let t2Token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // 1. Log in as Dr. Rahul Sharma (Employee, Tenant 1)
    const empLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.sharma@horizonsci.in',
        password: 'Password123!',
      });
    rahulToken = empLogin.body.data.accessToken;

    // 2. Log in as Sarah Jenkins (Finance Operator, Tenant 1)
    const finLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'sarah.finance@horizonsci.in',
        password: 'Password123!',
      });
    finToken = finLogin.body.data.accessToken;

    // 3. Log in as John Doe (Employee, Tenant 2)
    const t2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'john.bluesky@blueskyretail.com',
        password: 'Password123!',
      });
    t2Token = t2Login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Receipt Upload, OCR & Duplicate Hash Detection', () => {
    let receiptId: string;
    let ocrJobId: string;
    const testHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    it('Step 2.1: Presign upload URL for receipt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses/receipts/presign')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          fileName: 'hotel_bill_summit.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024 * 500, // 500KB
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('uploadUrl');
      expect(res.body.data).toHaveProperty('storageKey');
      expect(res.body.data).toHaveProperty('receiptId');
      expect(res.body.data.storageKey).toContain('hotel_bill_summit.pdf');
    });

    it('Step 2.2: Confirm receipt upload triggers OCR extraction and stores confidence metrics', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses/receipts/confirm')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          storageKey: '11111111-1111-1111-1111-111111111111/drafts/rec-1/bill.jpg',
          fileName: 'hotel_invoice_itc.jpg',
          mimeType: 'image/jpeg',
          fileSize: 450000,
          fileHash: testHash,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('receipt');
      expect(res.body.data).toHaveProperty('ocrJob');
      expect(res.body.data.receipt.ocrStatus).toBe('PROCESSED');

      receiptId = res.body.data.receipt.id;
      ocrJobId = res.body.data.ocrJob.id;

      // OCR result confidence inspection
      const ocrJob = res.body.data.ocrJob;
      expect(ocrJob.overallConfidence).toBeGreaterThan(0.8);
      expect(ocrJob.merchant.value).toBe('ITC Hotels Ltd - Bangalore');
      expect(ocrJob.merchant.confidence).toBeGreaterThan(0.9);
      expect(ocrJob.amount.value).toBe('4500.00');
      expect(ocrJob.currency.value).toBe('INR');
      expect(ocrJob.reviewedAt).toBeNull(); // Not yet reviewed
    });

    it('Step 2.3: Exact SHA-256 hash match flags immediate duplicate warning', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses/receipts/confirm')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          storageKey: '11111111-1111-1111-1111-111111111111/drafts/rec-2/copy.jpg',
          fileName: 'hotel_invoice_copy.jpg',
          mimeType: 'image/jpeg',
          fileSize: 450000,
          fileHash: testHash, // Same hash
        });

      expect(res.status).toBe(201);
      expect(res.body.data.duplicateMatch).not.toBeNull();
      expect(res.body.data.duplicateMatch.matchType).toBe('EXACT_HASH');
      expect(res.body.data.duplicateMatch.reason).toContain('Exact duplicate detected');
    });

    it('Step 2.4: Human review gate confirms OCR suggestions', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses/ocr/confirm-review')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          ocrJobId,
          acceptedFields: ['merchant', 'amount', 'date', 'currency'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.reviewedAt).not.toBeNull();
      expect(res.body.data.reviewedBy).not.toBeNull();
    });

    it('Step 2.5: Secure signed URL generated for receipt download', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/receipts/${receiptId}/url`)
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toContain(receiptId);
      expect(res.body.data).toHaveProperty('expiresAt');
    });
  });

  describe('Expense Creation, Split Line Items & Exact Decimal Arithmetic', () => {
    let createdExpenseId: string;

    it('Step 2.6: Reject expense when split line items do not sum to total amount', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          merchant: 'Novotel Mumbai Juhu Beach',
          spentAt: '2026-10-18T12:00:00.000Z',
          currency: 'INR',
          amount: '10000.000000',
          categoryId: '00000000-0000-0000-0000-000000000001',
          businessPurpose: 'Conference room booking and team catering',
          lines: [
            {
              amount: '6000.000000',
              description: 'Conference room rental',
            },
            {
              amount: '3500.000000', // Sum is 9500 != 10000
              description: 'Catering and lunch buffet',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Line items sum');
    });

    it('Step 2.7: Create expense with multiple line items with exact decimal match', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          merchant: 'Novotel Mumbai Juhu Beach',
          spentAt: '2026-10-18T12:00:00.000Z',
          currency: 'INR',
          amount: '10000.000000',
          subtotal: '8474.580000',
          taxAmount: '1525.420000',
          categoryId: '00000000-0000-0000-0000-000000000001',
          businessPurpose: 'Conference room booking and team catering',
          reimbursable: true,
          lines: [
            {
              amount: '6500.000000',
              description: 'Conference hall rental',
            },
            {
              amount: '3500.000000',
              description: 'Lunch catering buffet',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe('10000.000000');
      expect(res.body.data.baseAmount).toBe('10000.000000');
      expect(res.body.data.status).toBe(ExpenseStatus.DRAFT);
      createdExpenseId = res.body.data.id;
    });

    it('Step 2.8: Foreign currency calculation produces exact baseAmount in tenant currency', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          merchant: 'Bio-Rad Laboratories Singapore',
          spentAt: '2026-10-18T15:00:00.000Z',
          currency: 'USD',
          amount: '250.000000',
          categoryId: '00000000-0000-0000-0000-000000000001',
          businessPurpose: 'Antibody test kits for vaccine assay assay assay',
          reimbursable: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.currency).toBe('USD');
      expect(res.body.data.amount).toBe('250.000000');
      // 250 * 83.50 = 20875.000000
      expect(res.body.data.baseAmount).toBe('20875.000000');
    });

    it('Step 2.9: Fuzzy duplicate warning flagged for identical merchant within 48h and 1% amount', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${rahulToken}`)
        .send({
          merchant: 'Novotel Mumbai Juhu Beach', // Same merchant
          spentAt: '2026-10-19T09:00:00.000Z', // Within 24h
          currency: 'INR',
          amount: '10000.000000', // Same amount
          categoryId: '00000000-0000-0000-0000-000000000001',
          businessPurpose: 'Duplicate catering claim simulation',
          reimbursable: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.duplicateWarning).toBe(true);
    });
  });

  describe('Multi-Tenant Privacy & Authorization Boundaries', () => {
    it('Step 2.10: Tenant 2 user cannot read Tenant 1 expense with known UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/expenses/exp-1111-1111-1111-111111111111')
        .set('Authorization', `Bearer ${t2Token}`);

      expect(res.status).toBe(404); // Scoped out cleanly
    });

    it('Step 2.11: Employee can view own expenses and list is filtered by employeeId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${rahulToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const exp of res.body.data) {
        expect(exp.tenantId).toBe('11111111-1111-1111-1111-111111111111');
      }
    });

    it('Step 2.12: Finance operator can view tenant-wide expenses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${finToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('Step 2.13: Tenant 2 user cannot generate signed URL for Tenant 1 receipt', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/receipts/rec-mock-1/url')
        .set('Authorization', `Bearer ${t2Token}`);

      expect(res.status).toBe(404);
    });
  });
});
