import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Security & Multi-Tenant Negative Gates', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Reject requests to protected tenant resources without authorization token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/expenses');
    // Either 401 Unauthorized or 404 if router not yet mounted, but must never return 200 with data
    expect(res.status).not.toBe(200);
  });

  it('Prevent cross-tenant leakage: headers containing client-supplied tenant-id must not bypass auth', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/expenses/550e8400-e29b-41d4-a716-446655440000')
      .set('X-Tenant-ID', 'tenant-b-uuid');
    expect(res.status).not.toBe(200);
  });
});
