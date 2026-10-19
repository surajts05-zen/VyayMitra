import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { TokenService } from '../src/modules/auth/token.service.js';
import { Role } from '@vyay/contracts';

describe('M1: Cross-Tenant Negative Security Gates (e2e)', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  let tenantAToken: string;
  let tenantBToken: string;

  const t1Id = '11111111-1111-1111-1111-111111111111';
  const t2Id = '22222222-2222-2222-2222-222222222222';
  const t2EmpId = 'emp-t2-9999-9999-9999-999999999999';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    tokenService = moduleFixture.get<TokenService>(TokenService);

    // Tenant A Employee Token (Horizon Scientific)
    tenantAToken = tokenService.generateTokens({
      userId: 'dddd4444-4444-4444-4444-444444444444',
      tenantId: t1Id,
      membershipId: 'mem-emp-1',
      role: Role.EMPLOYEE,
      email: 'rahul.sharma@horizonsci.in',
    }).accessToken;

    // Tenant B Employee Token (BlueSky Retail)
    tenantBToken = tokenService.generateTokens({
      userId: 'eeee5555-5555-5555-5555-555555555555',
      tenantId: t2Id,
      membershipId: 'mem-t2-1',
      role: Role.EMPLOYEE,
      email: 'john.bluesky@blueskyretail.com',
    }).accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Tenant A employee CANNOT read Tenant B employee record even with known UUID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/employees/${t2EmpId}`)
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(res.status).toBe(404);
  });

  it('Tenant A employee CANNOT modify Tenant B employee record', async () => {
    // Admin in Tenant A
    const tenantAAdmin = tokenService.generateTokens({
      userId: 'aaaa1111-1111-1111-1111-111111111111',
      tenantId: t1Id,
      membershipId: 'mem-admin-1',
      role: Role.COMPANY_OWNER,
      email: 'admin@horizonsci.in',
    }).accessToken;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/employees/${t2EmpId}`)
      .set('Authorization', `Bearer ${tenantAAdmin}`)
      .send({ displayName: 'Malicious Name Tamper' });

    expect(res.status).toBe(404);
  });

  it('Header spoofing attempt (X-Tenant-ID mismatch) is rejected with 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .set('X-Tenant-ID', t2Id); // Spoofing Tenant 2

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Cross-tenant violation');
  });

  it('Query param spoofing attempt (?tenantId=...) is rejected with 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/employees?tenantId=${t2Id}`)
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Cross-tenant violation');
  });

  it('Tenant B employee CANNOT see Tenant A departments or org units', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/org/departments')
      .set('Authorization', `Bearer ${tenantBToken}`);

    expect(res.status).toBe(200);
    // Should be empty array for Tenant B, not leaking Tenant A's 'Research & Development'
    expect(res.body.data).toEqual([]);
  });

  it('Platform Super Admin is restricted from accessing tenant resources without delegated authority', async () => {
    const superAdminToken = tokenService.generateTokens({
      userId: 'super-admin-user-id',
      tenantId: t1Id,
      membershipId: 'mem-superadmin-1',
      role: Role.PLATFORM_SUPER_ADMIN,
      email: 'superadmin@vyaymitra.com',
    }).accessToken;

    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        employeeNumber: 'ILLEGAL-01',
        displayName: 'Illegal Employee',
        email: 'illegal@company.com',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Platform Super Admin is restricted');
  });
});
