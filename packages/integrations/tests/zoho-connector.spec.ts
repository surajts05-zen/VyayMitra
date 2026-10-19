import { describe, it, expect, beforeEach } from 'vitest';
import { ZohoBooksConnector, ZOHO_REGIONS } from '../src/zoho-connector.js';
import { ZohoRegion } from '@vyay/contracts';

describe('ZohoBooksConnector', () => {
  let connector: ZohoBooksConnector;

  beforeEach(() => {
    connector = new ZohoBooksConnector(ZohoRegion.IN, true);
  });

  it('should generate region-aware OAuth authorization URL for India (IN)', () => {
    const authUrl = connector.buildAuthUrl('tenant-1', 'https://app.vyaymitra.in/oauth/callback', 'state-xyz');
    expect(authUrl).toContain('accounts.zoho.in/oauth/v2/auth');
    expect(authUrl).toContain('state=state-xyz');
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('ZohoBooks.expenses.ALL');
  });

  it('should generate region-aware OAuth authorization URL for US and EU', () => {
    const usConnector = new ZohoBooksConnector(ZohoRegion.US, true);
    const usUrl = usConnector.buildAuthUrl('tenant-1', 'https://app.vyaymitra.com/oauth/callback', 'state-us');
    expect(usUrl).toContain('accounts.zoho.com/oauth/v2/auth');

    const euConnector = new ZohoBooksConnector(ZohoRegion.EU, true);
    const euUrl = euConnector.buildAuthUrl('tenant-1', 'https://app.vyaymitra.eu/oauth/callback', 'state-eu');
    expect(euUrl).toContain('accounts.zoho.eu/oauth/v2/auth');
  });

  it('should exchange code for access and refresh tokens', async () => {
    const tokens = await connector.exchangeCode('tenant-1', 'valid_auth_code_123', 'state-xyz');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(3600);
    expect(tokens.apiDomain).toBe(ZOHO_REGIONS[ZohoRegion.IN].apiUrl);
  });

  it('should fail with invalid_grant when code is invalid or missing', async () => {
    await expect(
      connector.exchangeCode('tenant-1', '', 'state-xyz')
    ).rejects.toThrow('invalid_grant');
  });

  it('should refresh access token using refresh token', async () => {
    const refreshed = await connector.refreshToken('valid_refresh_token_xyz');
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.expiresIn).toBe(3600);
  });

  it('should retrieve reference data (accounts, tax codes, vendors, projects)', async () => {
    const refData = await connector.fetchReferenceData();
    expect(refData.accounts.length).toBeGreaterThan(0);
    expect(refData.taxes.length).toBeGreaterThan(0);
    expect(refData.vendors.length).toBeGreaterThan(0);
    expect(refData.projects.length).toBeGreaterThan(0);

    const travelAcc = refData.accounts.find((a) => a.code === '6010');
    expect(travelAcc).toBeDefined();
    expect(travelAcc?.name).toBe('Travel & Conveyance');
  });

  it('should validate posting preview with dry-run verification', async () => {
    const preview = await connector.previewPosting('report-101', [
      {
        id: '00000000-0000-0000-0000-000000000001',
        provider: 'zoho_books',
        localType: 'CATEGORY',
        localId: 'cat-travel',
        localName: 'Travel',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'zoho-acc-6010',
        externalName: 'Travel & Conveyance',
      },
    ]);

    expect(preview.reportId).toBe('report-101');
    expect(preview.allMapped).toBe(true);
    expect(preview.dryRunValidated).toBe(true);
    expect(preview.validationMessages.length).toBeGreaterThan(0);
  });

  it('should flag unmapped categories in dry-run preview', async () => {
    const preview = await connector.previewPosting('report-101', []);
    expect(preview.allMapped).toBe(false);
    expect(preview.dryRunValidated).toBe(false);
    expect(preview.validationMessages).toContain('Unmapped expense categories found. Please complete GL account mappings.');
  });

  it('should post expense idempotently with remoteReference', async () => {
    const payload = {
      reportId: 'rep-1',
      totalAmount: '4500.00',
      description: 'Client visit Bengaluru',
    };

    const res1 = await connector.postExpense(payload, 'token-xyz', 'org-101', 'idemp-key-zoho-1');
    expect(res1.status).toBe('ACCEPTED');
    expect(res1.externalId).toBeDefined();
    expect(res1.remoteReference).toBe('idemp-key-zoho-1');

    // Duplicate call with exact same idempotency key must return cached result
    const res2 = await connector.postExpense(payload, 'token-xyz', 'org-101', 'idemp-key-zoho-1');
    expect(res2.externalId).toBe(res1.externalId);
    expect(res2.remoteReference).toBe(res1.remoteReference);
  });

  it('should simulate 429 rate limit backoff recovery', async () => {
    connector.setFailureMode('429_RATE_LIMIT');
    await expect(
      connector.postExpense({ title: 'Test' }, 'token', 'org', 'idemp-429')
    ).rejects.toMatchObject({
      status: 429,
      retryAfter: 2,
    });
  });

  it('should check connection health correctly', async () => {
    const healthy = await connector.testConnection('conn-101');
    expect(healthy.connected).toBe(true);
    expect(healthy.externalOrgName).toBe('Acme BioTech India Pvt Ltd');

    const unhealthy = await connector.testConnection('');
    expect(unhealthy.connected).toBe(false);
    expect(unhealthy.error).toBeDefined();
  });
});
