import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { TokenService } from '../src/modules/auth/token.service.js';
import { Role } from '@vyay/contracts';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Platform Super Admin & Audited Password Resets (Milestone Extension)', () => {
  let app: INestApplication;
  let tokenService: TokenService;

  let superAdminToken: string;
  let employeeToken: string;
  let companyAdminToken: string;

  const tenant1Id = '11111111-1111-1111-1111-111111111111';
  const targetUserId = 'dddd4444-4444-4444-4444-444444444444'; // Dr. Rahul Sharma (EMPLOYEE)
  const targetUserEmail = 'rahul.sharma@horizonsci.in';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    tokenService = app.get(TokenService);

    // 1. Platform Super Admin Token
    superAdminToken = tokenService.generateTokens({
      userId: 'ffff0000-0000-0000-0000-000000000000',
      tenantId: '00000000-0000-0000-0000-000000000000',
      membershipId: 'mem-superadmin-0',
      role: Role.PLATFORM_SUPER_ADMIN,
      email: 'superadmin@vyaymitra.internal',
    }).accessToken;

    // 2. Regular Tenant Employee Token
    employeeToken = tokenService.generateTokens({
      userId: targetUserId,
      tenantId: tenant1Id,
      membershipId: 'mem-emp-1',
      role: Role.EMPLOYEE,
      email: targetUserEmail,
    }).accessToken;

    // 3. Company Admin Token
    companyAdminToken = tokenService.generateTokens({
      userId: 'aaaa1111-1111-1111-1111-111111111111',
      tenantId: tenant1Id,
      membershipId: 'mem-admin-1',
      role: Role.COMPANY_OWNER,
      email: 'admin@horizonsci.in',
    }).accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ─── Negative Authorization Gates ───────────────────────────────────────────

  it('Reject unauthenticated access to platform endpoints with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/platform/stats');
    expect(res.status).toBe(401);
  });

  it('Reject standard employee from accessing platform tenant list with 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/tenants')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  it('Reject Company Owner of a tenant from accessing platform management with 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/tenants')
      .set('Authorization', `Bearer ${companyAdminToken}`);
    expect(res.status).toBe(403);
  });

  // ─── Super Admin Tenant & Stats Operations ──────────────────────────────────

  it('Allow Platform Super Admin to retrieve system health & platform stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.systemStatus).toBe('OPERATIONAL');
    expect(res.body.data.totalTenants).toBeGreaterThanOrEqual(2);
    expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(4);
  });

  it('Allow Platform Super Admin to list all corporate tenants', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const tenantIds = res.body.data.map((t: any) => t.id);
    expect(tenantIds).toContain(tenant1Id);
  });

  it('Allow Platform Super Admin to list users of a specific tenant', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/tenants/${tenant1Id}/users`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const emails = res.body.data.map((u: any) => u.email);
    expect(emails).toContain(targetUserEmail);
  });

  // ─── Audited Password Reset Flow ────────────────────────────────────────────

  it('Reject password reset when audit reason is omitted or too short', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/platform/tenants/${tenant1Id}/users/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        newPassword: 'BrandNewSecurePass99!',
        reason: 'no', // too short
      });

    expect(res.status).toBe(400);
  });

  it('Allow Platform Super Admin to reset user password with reason and session invalidation', async () => {
    // 1. Generate an active token for target user before reset
    const preResetToken = tokenService.generateTokens({
      userId: targetUserId,
      tenantId: tenant1Id,
      membershipId: 'mem-emp-1',
      role: Role.EMPLOYEE,
      email: targetUserEmail,
    }).accessToken;

    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 100));

    // 2. Perform administrative password reset
    const newPassword = 'NewlyResetPassword2026!';
    const resetRes = await request(app.getHttpServer())
      .post(`/api/v1/platform/tenants/${tenant1Id}/users/${targetUserId}/reset-password`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        newPassword,
        reason: 'User locked out of authenticator app - Support Ticket #5910',
        revokeExistingSessions: true,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.data.success).toBe(true);
    expect(resetRes.body.data.sessionsRevoked).toBe(true);
    expect(resetRes.body.data.auditLogId).toBeDefined();

    // 3. Verifying that attempting to log in with OLD password now fails (401)
    const oldLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: targetUserEmail,
        password: 'Password123!',
      });
    expect(oldLoginRes.status).toBe(401);

    // 4. Verifying that logging in with NEW password succeeds (200)
    const newLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: targetUserEmail,
        password: newPassword,
      });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.accessToken).toBeDefined();

    // 5. Verifying that the token issued BEFORE the reset is now revoked
    expect(() => tokenService.verifyAccessToken(preResetToken)).toThrow(
      'Session invalidated due to password reset. Please log in again.'
    );
  });

  // ─── Tenant Lifecycle Management ────────────────────────────────────────────

  it('Allow Platform Super Admin to toggle tenant status to SUSPENDED and update plan', async () => {
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/platform/tenants/${tenant1Id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        status: 'SUSPENDED',
        plan: 'GROWTH',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe('SUSPENDED');
    expect(patchRes.body.data.plan).toBe('GROWTH');

    // Restore to ACTIVE
    await request(app.getHttpServer())
      .patch(`/api/v1/platform/tenants/${tenant1Id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
      });
  });

  it('Allow Platform Super Admin to provision a new corporate tenant', async () => {
    const newTenantRes = await request(app.getHttpServer())
      .post('/api/v1/platform/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Apex Biotech Solutions Pvt Ltd',
        slug: `apex-biotech-${Date.now()}`,
        baseCurrency: 'INR',
        country: 'IN',
        timezone: 'Asia/Kolkata',
        fiscalYearStartMonth: 4,
        adminEmail: `founder.${Date.now()}@apexbiotech.in`,
        adminFirstName: 'Aditi',
        adminLastName: 'Rao',
        initialPassword: 'SecureApexPassword123!',
        plan: 'ENTERPRISE',
      });

    expect(newTenantRes.status).toBe(201);
    expect(newTenantRes.body.data.name).toBe('Apex Biotech Solutions Pvt Ltd');
    expect(newTenantRes.body.data.status).toBe('ACTIVE');
  });

  it('Allow Platform Super Admin to view immutable audit logs', async () => {
    const auditRes = await request(app.getHttpServer())
      .get('/api/v1/platform/audit-logs')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.body.data)).toBe(true);
    const actions = auditRes.body.data.map((l: any) => l.action);
    expect(actions).toContain('USER_PASSWORD_RESET');
    expect(actions).toContain('TENANT_CREATED');
  });

  // ─── Segregation of Duties Invariant Gate ────────────────────────────────────

  it('Platform Super Admin must NOT bypass tenant authorization to access tenant financial review queue', async () => {
    // Calling tenant finance review queue with super admin token
    const res = await request(app.getHttpServer())
      .get('/api/v1/finance/review-queue')
      .set('Authorization', `Bearer ${superAdminToken}`);

    // Per blueprint & RolesGuard: Platform Super Admin is restricted from accessing tenant finance records without delegation
    expect(res.status).toBe(403);
  });

  it('Platform Super Admin cannot spoof another tenant ID to view other tenant expenses', async () => {
    // Calling /api/v1/expenses with super admin token attempting to inspect tenant 1
    const res = await request(app.getHttpServer())
      .get('/api/v1/expenses')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('X-Tenant-ID', tenant1Id);

    // Cross-tenant guard prevents client header spoofing
    expect(res.status).toBe(403);
  });
});
