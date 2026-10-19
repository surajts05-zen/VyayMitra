import { describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig, RuntimeConfig } from '../src/common/config/runtime-config.js';
import { resolveRequestId } from '../src/common/request-context.js';
import { RateLimitMiddleware } from '../src/common/rate-limit.middleware.js';
import { MetricsService, normalizeMetricRoute } from '../src/modules/observability/metrics.service.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { WebhooksService } from '../src/modules/developer/webhooks.service.js';
import { RetentionService } from '../src/modules/retention/retention.service.js';
import { WebhookEvent } from '@vyay/contracts';

function productionEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    PORT: '3000',
    APP_URL: 'https://expenses.example.com',
    DATABASE_URL: 'postgresql://service:secret@db.example.com/vyaymitra',
    JWT_SECRET: 'access-secret-that-is-unique-and-long-enough-123',
    JWT_REFRESH_SECRET: 'refresh-secret-that-is-different-and-long-456',
    API_CREDENTIAL_PEPPER: 'api-key-pepper-that-is-unique-and-long-789',
    OBSERVABILITY_TOKEN: 'metrics-token-that-is-unique-and-long-012',
  };
}

describe('M7 production configuration', () => {
  it('accepts explicit secure production settings', () => {
    const config = loadRuntimeConfig(productionEnv());
    expect(config.isProduction).toBe(true);
    expect(config.allowedOrigins).toEqual(['https://expenses.example.com']);
    expect(config.allowOfflineDatabase).toBe(false);
    expect(config.enableApiDocs).toBe(false);
  });

  it('rejects development secrets and non-HTTPS production origins', () => {
    expect(() => loadRuntimeConfig({ ...productionEnv(), JWT_SECRET: 'change-me' })).toThrow(/JWT_SECRET/);
    expect(() => loadRuntimeConfig({ ...productionEnv(), APP_URL: 'http://localhost:5173' })).toThrow(/HTTPS/);
  });

  it('rejects production without database and observability credentials', () => {
    const missingDatabase = productionEnv();
    delete missingDatabase.DATABASE_URL;
    expect(() => loadRuntimeConfig(missingDatabase)).toThrow(/DATABASE_URL/);
    const missingMetrics = productionEnv();
    delete missingMetrics.OBSERVABILITY_TOKEN;
    expect(() => loadRuntimeConfig(missingMetrics)).toThrow(/OBSERVABILITY_TOKEN/);
  });
});

describe('M7 request protection', () => {
  it('accepts conservative request IDs and replaces unsafe values cryptographically', () => {
    expect(resolveRequestId('client-request_123')).toBe('client-request_123');
    expect(resolveRequestId('<script>alert(1)</script>')).toMatch(/^req_[0-9a-f-]{36}$/);
  });

  it('applies a stricter authentication rate limit and emits retry metadata', () => {
    let now = 1_000;
    const config = {
      rateLimit: { windowMs: 60_000, max: 100 },
      authRateLimit: { windowMs: 60_000, max: 2 },
    } as RuntimeConfig;
    const middleware = new RateLimitMiddleware(config, () => now);
    const headers = new Map<string, string>();
    const req = {
      path: '/api/v1/auth/login',
      ip: '203.0.113.10',
      socket: {},
      headers: {},
    } as any;
    const res = { setHeader: (key: string, value: string) => headers.set(key, value) } as any;
    const next = vi.fn();

    middleware.use(req, res, next);
    middleware.use(req, res, next);
    expect(() => middleware.use(req, res, next)).toThrow(/Too many requests/);
    expect(headers.get('Retry-After')).toBe('60');
    expect(next).toHaveBeenCalledTimes(2);
    now += 60_001;
    expect(() => middleware.use(req, res, next)).not.toThrow();
  });

  it('does not disclose unexpected exception details to clients', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          headers: {},
          method: 'GET',
          url: '/api/v1/test',
          path: '/api/v1/test',
        }),
      }),
    } as any;

    new HttpExceptionFilter().catch(new Error('password=internal-secret SQL failed'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0].error.message).toBe('Internal server error');
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('internal-secret');
  });
});

describe('M7 privacy-bounded observability', () => {
  it('normalizes IDs and query strings before using a route as a metric label', () => {
    const raw = '/api/v1/expenses/4f793ee2-6b39-43b2-b72b-901179b02932?tenantId=secret';
    expect(normalizeMetricRoute(raw)).toBe('/api/v1/expenses/:id');
    const metrics = new MetricsService();
    metrics.observe('GET', raw, 200, 12.5);
    const output = metrics.renderPrometheus();
    expect(output).toContain('route="/api/v1/expenses/:id"');
    expect(output).not.toContain('tenantId');
    expect(output).not.toContain('4f793ee2');
  });
});

describe('M7 SSRF and retention controls', () => {
  it('rejects local/private webhook targets and accepts a public HTTPS target', () => {
    const service = new WebhooksService();
    const input = { events: [WebhookEvent.REPORT_APPROVED], active: true };
    expect(() => service.createSubscription('tenant-1', { ...input, url: 'http://127.0.0.1/hook' })).toThrow(/HTTPS/);
    expect(() => service.createSubscription('tenant-1', { ...input, url: 'https://192.168.1.4/hook' })).toThrow(/private/);
    expect(service.createSubscription('tenant-1', { ...input, url: 'https://hooks.example.com/vyay' }).url)
      .toBe('https://hooks.example.com/vyay');
  });

  it('keeps retention preview tenant-scoped and defaults execution to disabled', async () => {
    const count = vi.fn().mockResolvedValue(3);
    const prisma = { ocrJob: { count } } as any;
    const service = new RetentionService(prisma);
    const preview = await service.preview('tenant-a');
    expect(preview.eligible.reviewedOcrProviderPayloads).toBe(3);
    expect(preview.executionEnabled).toBe(false);
    expect(preview.excluded).toContain('audit_events');
    expect(count.mock.calls[0][0].where.receipt.expense.tenantId).toBe('tenant-a');
    await expect(service.execute('tenant-a', 'actor-a', {})).rejects.toThrow(/disabled/);
  });
});

