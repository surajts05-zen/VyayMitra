import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { Role } from '@vyay/contracts';

describe('M1: Authentication & Tenancy (e2e)', () => {
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

  it('POST /api/v1/auth/login should authenticate seeded admin and return JWT tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@horizonsci.in',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe('admin@horizonsci.in');
    expect(res.body.data.tenant.role).toBe(Role.COMPANY_OWNER);
  });

  it('POST /api/v1/auth/login with wrong password should fail with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@horizonsci.in',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/register should register new company and return owner tokens', async () => {
    const uniqueEmail = `test.founder.${Date.now()}@newstartup.io`;
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'SecurePassword123!',
        firstName: 'Alex',
        lastName: 'Vance',
        companyName: 'Vance Dynamics',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.tenant.name).toBe('Vance Dynamics');
    expect(res.body.data.tenant.role).toBe(Role.COMPANY_OWNER);
  });

  it('POST /api/v1/auth/refresh should issue fresh access token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'sarah.finance@horizonsci.in',
        password: 'Password123!',
      });

    const refreshToken = loginRes.body.data.refreshToken;

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
  });

  it('Invite & Accept flow: Admin can invite member and member can accept', async () => {
    // 1. Login as Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@horizonsci.in',
        password: 'Password123!',
      });
    const token = adminLogin.body.data.accessToken;

    // 2. Invite new employee
    const inviteEmail = `invitee.${Date.now()}@horizonsci.in`;
    const inviteRes = await request(app.getHttpServer())
      .post('/api/v1/auth/invitations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: inviteEmail,
        role: Role.EMPLOYEE,
        displayName: 'Invited Scientist',
      });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data).toHaveProperty('inviteToken');
    const inviteToken = inviteRes.body.data.inviteToken;

    // 3. Accept Invite
    const acceptRes = await request(app.getHttpServer())
      .post('/api/v1/auth/accept-invite')
      .send({
        token: inviteToken,
        password: 'NewUserPassword123!',
        firstName: 'Invited',
        lastName: 'Scientist',
      });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.user.email).toBe(inviteEmail);
    expect(acceptRes.body.data.tenant.role).toBe(Role.EMPLOYEE);
  });

  it('Role escalation prevention: Admin cannot invite a Company Owner or Platform Super Admin', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'compadmin@horizonsci.in',
        password: 'Password123!',
      });

    const adminToken = adminLogin.body.data.accessToken;

    // Company Admin cannot invite a COMPANY_OWNER -> 403 Forbidden
    const resOwner = await request(app.getHttpServer())
      .post('/api/v1/auth/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'illegal.owner@horizonsci.in',
        role: Role.COMPANY_OWNER,
      });

    expect(resOwner.status).toBe(403);

    // Cannot invite PLATFORM_SUPER_ADMIN -> 400 Bad Request
    const resSuper = await request(app.getHttpServer())
      .post('/api/v1/auth/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'illegal.super@horizonsci.in',
        role: Role.PLATFORM_SUPER_ADMIN,
      });

    expect(resSuper.status).toBe(400);
  });

  it('Revoking membership invalidates sessions immediately', async () => {
    // 1. Login as employee to get valid token
    const empLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'temp.revoked@horizonsci.in',
        password: 'Password123!',
      });
    const empToken = empLogin.body.data.accessToken;

    // Verify token works
    const check1 = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${empToken}`);
    expect(check1.status).toBe(200);

    // 2. Admin revokes employee membership
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@horizonsci.in',
        password: 'Password123!',
      });
    const adminToken = adminLogin.body.data.accessToken;

    const revokeRes = await request(app.getHttpServer())
      .delete('/api/v1/auth/memberships/mem-revoked-1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(revokeRes.status).toBe(200);

    // 3. Employee token should now be rejected immediately
    const check2 = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${empToken}`);
    expect(check2.status).toBe(401);
  });
});
