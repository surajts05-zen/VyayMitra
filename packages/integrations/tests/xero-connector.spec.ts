import { describe, it, expect, beforeEach } from 'vitest';
import { XeroConnector } from '../src/xero-connector.js';

describe('XeroConnector', () => {
  let connector: XeroConnector;

  beforeEach(() => {
    connector = new XeroConnector();
  });

  it('should declare correct connector capabilities', () => {
    expect(connector.name).toBe('xero');
    expect(connector.capabilities.supportsBills).toBe(true);
    expect(connector.capabilities.supportsReceiptAttachment).toBe(true);
    expect(connector.capabilities.supportsTaxMapping).toBe(true);
    expect(connector.capabilities.supportsVendorMapping).toBe(true);
  });

  it('should generate valid Xero OAuth 2.0 authorization URL', () => {
    const authUrl = connector.buildAuthUrl('tenant-1', 'https://app.vyaymitra.in/oauth/xero/callback', 'state-xero-123');
    expect(authUrl).toContain('login.xero.com/identity/connect/authorize');
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('accounting.transactions');
    expect(authUrl).toContain('offline_access');
    expect(authUrl).toContain('state=state-xero-123');
  });

  it('should exchange code for Xero access and refresh tokens', async () => {
    const tokens = await connector.exchangeCode('tenant-1', 'valid_xero_code', 'state-xero-123');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(1800);
    expect(tokens.apiDomain).toBe('https://api.xero.com/api.xro/2.0');
  });

  it('should refresh Xero access tokens', async () => {
    const refreshed = await connector.refreshToken('valid_xero_refresh_token');
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.expiresIn).toBe(1800);
  });

  it('should retrieve reference data (Chart of Accounts, Tax Rates, Contacts, Tracking)', async () => {
    const refData = await connector.fetchReferenceData();
    expect(refData.accounts.length).toBeGreaterThan(0);
    expect(refData.taxes.length).toBeGreaterThan(0);
    expect(refData.vendors.length).toBeGreaterThan(0);
    expect(refData.projects.length).toBeGreaterThan(0);

    const travelAcc = refData.accounts.find((a) => a.code === '420');
    expect(travelAcc).toBeDefined();
    expect(travelAcc?.name).toContain('Travel');
  });

  it('should generate posting preview for Xero ACCPAY Bill', async () => {
    const preview = await connector.previewPosting('report-1', [
      {
        id: 'map-1',
        provider: 'xero',
        localType: 'CATEGORY',
        localId: 'cat-air-travel',
        localName: 'Air Travel',
        externalType: 'ACCOUNT',
        externalId: 'xero-acc-420',
        externalName: 'Travel (420)',
      },
    ]);

    expect(preview.allMapped).toBe(true);
    expect(preview.dryRunValidated).toBe(true);
    expect(preview.lines.length).toBe(1);
    expect(preview.lines[0].glAccountId).toBe('xero-acc-420');
  });

  it('should post bill to Xero and enforce idempotency', async () => {
    const payload = {
      lines: [{ description: 'Flight to Delhi', amount: '4500.00' }],
      total: '4500.00',
    };
    const key = 'idem-xero-test-01';

    const post1 = await connector.postExpense(payload, 'token-1', 'org-1', key);
    expect(post1.status).toBe('ACCEPTED');
    expect(post1.remoteReference).toContain('INV-XERO');

    const post2 = await connector.postExpense(payload, 'token-1', 'org-1', key);
    expect(post2.remoteReference).toBe(post1.remoteReference);
    expect(post2.externalId).toBe(post1.externalId);
  });
});
