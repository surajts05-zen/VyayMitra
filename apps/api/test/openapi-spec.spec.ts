import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { AppModule } from '../src/app.module.js';

describe('OpenAPI Specification Generator and Verifier', () => {
  let app: INestApplication;
  let document: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('VyayMitra API')
      .setDescription('VyayMitra Enterprise Multi-Tenant Expense Management SaaS REST API')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT access token with tenant claims',
          in: 'header',
        },
        'JWT-auth'
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'Idempotency-Key',
          in: 'header',
          description: 'Unique client-supplied key for state-mutating financial operations',
        },
        'Idempotency-Key'
      )
      .build();

    document = SwaggerModule.createDocument(app, config);
    document.openapi = '3.1.0';

    const rootDocPath = fileURLToPath(new URL('../../../openapi.json', import.meta.url));
    writeFileSync(rootDocPath, JSON.stringify(document, null, 2));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('generates valid OpenAPI 3.1.0 document with all key routes across M0-M7', () => {
    expect(document.openapi).toBe('3.1.0');
    expect(document.info.title).toBe('VyayMitra API');
    expect(document.paths).toBeDefined();

    // Verify presence of all major milestone endpoints
    const paths = Object.keys(document.paths);
    expect(paths).toContain('/api/health/live');
    expect(paths).toContain('/api/v1/auth/login');
    expect(paths).toContain('/api/v1/expenses');
    expect(paths).toContain('/api/v1/reports');
    expect(paths).toContain('/api/v1/finance/review-queue');
    expect(paths).toContain('/api/v1/integrations/zoho/auth-url');
    expect(paths).toContain('/api/v1/analytics/summary');
    expect(paths).toContain('/api/v1/developer/api-credentials');
    expect(paths).toContain('/api/v1/developer/webhooks');
    expect(paths).toContain('/api/v1/settings/retention');
  });
});
