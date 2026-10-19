import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { TokenService } from '../src/modules/auth/token.service.js';
import { Role } from '@vyay/contracts';

describe('M1: Employees & Organization Master Data (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  const t1Id = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    const tokenService = moduleFixture.get<TokenService>(TokenService);
    adminToken = tokenService.generateTokens({
      userId: 'aaaa1111-1111-1111-1111-111111111111',
      tenantId: t1Id,
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

  it('GET /api/v1/employees should list employees for tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    const empNames = res.body.data.map((e: any) => e.displayName);
    expect(empNames).toContain('Anita Deshmukh');
    expect(empNames).toContain('Dr. Rahul Sharma');
  });

  it('HRM Independence: Creating employee without external_hrm_id works completely', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeNumber: `EMP-${Date.now().toString().slice(-4)}`,
        displayName: 'Standalone Chemist',
        email: `chemist.${Date.now()}@horizonsci.in`,
        grade: 'Junior Scientist',
        branch: 'Bangalore Campus',
        // externalHrmId is omitted — operates in standalone mode
      });

    expect(res.status).toBe(201);
    expect(res.body.data.displayName).toBe('Standalone Chemist');
    expect(res.body.data.externalHrmId).toBeNull();
  });

  it('GET /api/v1/employees/hierarchy should return nested manager-subordinate tree', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/employees/hierarchy')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Anita Deshmukh should be at root with Dr. Rahul Sharma as subordinate
    const anita = res.body.data.find((n: any) => n.displayName === 'Anita Deshmukh');
    expect(anita).toBeDefined();
    expect(anita.subordinates.length).toBeGreaterThanOrEqual(1);
    expect(anita.subordinates[0].displayName).toBe('Dr. Rahul Sharma');
  });

  it('Circular reporting prevention: setting subordinate as manager is rejected with 400', async () => {
    const mgrId = 'emp-mgr-1111-1111-1111-111111111111'; // Anita
    const empId = 'emp-rahul-2222-2222-2222-222222222222'; // Rahul (already reports to Anita)

    // Attempt to set Anita's manager to Rahul -> circular cycle
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/employees/${mgrId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        managerId: empId,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Circular manager hierarchy detected');
  });

  it('Soft deactivation preserves employee history with active=false', async () => {
    // Create temporary employee
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeNumber: `DEACT-${Date.now().toString().slice(-4)}`,
        displayName: 'Retiring Researcher',
        email: `retiring.${Date.now()}@horizonsci.in`,
      });
    const id = createRes.body.data.id;

    // Soft delete
    const delRes = await request(app.getHttpServer())
      .delete(`/api/v1/employees/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.active).toBe(false);

    // Verify record still exists when fetching by ID
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/employees/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.active).toBe(false);
  });

  it('Org master data: create and list departments, cost centers, projects, categories', async () => {
    // 1. Department
    const deptRes = await request(app.getHttpServer())
      .post('/api/v1/org/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `QA-${Date.now().toString().slice(-4)}`, name: 'Quality Assurance' });
    expect(deptRes.status).toBe(201);

    // 2. Cost Center
    const ccRes = await request(app.getHttpServer())
      .post('/api/v1/org/cost-centers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `CC-HYD-${Date.now().toString().slice(-4)}`, name: 'Hyderabad Bio Center' });
    expect(ccRes.status).toBe(201);

    // 3. Project
    const projRes = await request(app.getHttpServer())
      .post('/api/v1/org/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `PROJ-${Date.now().toString().slice(-4)}`, name: 'Clinical Trial Phase 1' });
    expect(projRes.status).toBe(201);

    // 4. Category with Account Mapping
    const catRes = await request(app.getHttpServer())
      .post('/api/v1/org/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: `SOFTWARE-${Date.now().toString().slice(-4)}`,
        name: 'Cloud & Software Subscriptions',
        accountMapping: '6040',
      });
    expect(catRes.status).toBe(201);
    expect(catRes.body.data.accountMapping).toBe('6040');
  });
});
