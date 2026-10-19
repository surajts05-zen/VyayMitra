import { describe, it, expect, beforeEach } from 'vitest';
import { MockAccountingConnector } from '../src/mock-connector.js';

describe('MockAccountingConnector', () => {
  let connector: MockAccountingConnector;

  beforeEach(() => {
    connector = new MockAccountingConnector();
  });

  it('should post expense successfully and generate external id and remote reference', async () => {
    const result = await connector.postExpense(
      { merchant: 'Test' },
      'mock_token',
      'mock_org',
      'idemp-key-1'
    );
    expect(result.status).toBe('ACCEPTED');
    expect(result.externalId).toBeDefined();
    expect(result.remoteReference).toBe('idemp-key-1');
  });

  it('should guarantee idempotency when re-posting with identical idempotency key', async () => {
    const res1 = await connector.postExpense({ merchant: 'Test' }, 'token', 'org', 'idemp-duplicate-check');
    const res2 = await connector.postExpense({ merchant: 'Test' }, 'token', 'org', 'idemp-duplicate-check');
    expect(res1.externalId).toBe(res2.externalId);
  });

  it('should simulate 429 Rate Limit error with retryAfter attribute', async () => {
    connector.setFailureMode('429_RATE_LIMIT');
    await expect(
      connector.postExpense({ merchant: 'Test' }, 'token', 'org', 'idemp-429')
    ).rejects.toMatchObject({
      status: 429,
      retryAfter: 60,
    });
  });

  it('should simulate 504 Timeout error for lost response recovery tests', async () => {
    connector.setFailureMode('TIMEOUT');
    await expect(
      connector.postExpense({ merchant: 'Test' }, 'token', 'org', 'idemp-timeout')
    ).rejects.toMatchObject({
      status: 504,
    });
  });
});
