import {
  AccountingConnector,
  ConnectorCapabilities,
  ConnectionHealth,
  ExternalReferenceData,
  RemotePostingResult,
} from './interfaces.js';
import { ExternalMapping, PostingPreview } from '@vyay/contracts';

export class MockAccountingConnector implements AccountingConnector {
  readonly name = 'mock_connector';
  readonly capabilities: ConnectorCapabilities = {
    supportsExpenses: true,
    supportsBills: true,
    supportsReceiptAttachment: true,
    supportsWebhooks: true,
    supportsTaxMapping: true,
    supportsVendorMapping: true,
    supportsProjectMapping: true,
  };

  private simulatedFailureMode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT' = 'NONE';
  private postedRecords = new Map<string, RemotePostingResult>();

  setFailureMode(mode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT') {
    this.simulatedFailureMode = mode;
  }

  buildAuthUrl(tenantId: string, redirectUri: string, state: string): string {
    return `https://mock-accounting.com/oauth/authorize?tenant=${tenantId}&redirect=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  async exchangeCode(_tenantId: string, _code: string, _state: string) {
    if (this.simulatedFailureMode === 'INVALID_GRANT') {
      throw new Error('invalid_grant: code expired or already redeemed');
    }
    return {
      accessToken: 'mock_access_token_123',
      refreshToken: 'mock_refresh_token_456',
      expiresIn: 3600,
      apiDomain: 'mock-accounting.com',
    };
  }

  async refreshToken(_refreshToken: string) {
    if (this.simulatedFailureMode === 'INVALID_GRANT') {
      throw new Error('invalid_grant: refresh token revoked');
    }
    return {
      accessToken: 'mock_refreshed_access_token_789',
      expiresIn: 3600,
    };
  }

  async testConnection(_connectionId: string): Promise<ConnectionHealth> {
    return {
      connected: true,
      provider: this.name,
      externalOrgId: 'mock-org-1',
      externalOrgName: 'Mock Enterprise Ltd',
      expiresInSeconds: 3600,
      scopes: ['accounting.read', 'accounting.write'],
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async listOrganizations() {
    return [
      { id: 'mock-org-1', name: 'Mock Enterprise India Ltd' },
      { id: 'mock-org-2', name: 'Mock Global Corp' },
    ];
  }

  async fetchReferenceData(): Promise<ExternalReferenceData> {
    return {
      accounts: [
        { id: 'acc-6010', name: 'Travel & Conveyance', code: '6010', type: 'expense' },
        { id: 'acc-6020', name: 'Meals & Entertainment', code: '6020', type: 'expense' },
        { id: 'acc-6030', name: 'Office Supplies', code: '6030', type: 'expense' },
        { id: 'acc-1010', name: 'Petty Cash', code: '1010', type: 'cash' },
        { id: 'acc-1020', name: 'HDFC Corporate Bank Account', code: '1020', type: 'bank' },
      ],
      taxes: [
        { id: 'tax-gst-18', name: 'GST 18%', rate: '18.0' },
        { id: 'tax-gst-12', name: 'GST 12%', rate: '12.0' },
        { id: 'tax-gst-5', name: 'GST 5%', rate: '5.0' },
        { id: 'tax-exempt', name: 'Exempt', rate: '0.0' },
      ],
      vendors: [
        { id: 'ven-indigo', name: 'IndiGo Airlines', gstin: '07AABCI1234F1Z1' },
        { id: 'ven-uber', name: 'Uber India Technologies', gstin: '27AABCU5678G2Z2' },
      ],
      projects: [
        { id: 'proj-omega', name: 'Project Omega Enterprise' },
        { id: 'proj-beta', name: 'Project Beta Migration' },
      ],
    };
  }

  async previewPosting(reportId: string, mappings: ExternalMapping[]): Promise<PostingPreview> {
    const isMapped = mappings.length > 0;
    return {
      reportId,
      reportTitle: 'Mock Report #101',
      totalAmount: '2500.00',
      lines: [
        {
          expenseId: '00000000-0000-0000-0000-000000000001',
          merchant: 'IndiGo Airlines',
          amount: '2500.00',
          categoryName: 'Travel',
          glAccountId: isMapped ? 'acc-6010' : null,
          glAccountName: isMapped ? 'Travel & Conveyance' : null,
          taxCodeId: isMapped ? 'tax-gst-18' : null,
          taxCodeName: isMapped ? 'GST 18%' : null,
          paidThroughAccountId: isMapped ? 'acc-1010' : null,
          isMapped,
        },
      ],
      allMapped: isMapped,
      dryRunValidated: isMapped,
      validationMessages: isMapped
        ? ['All expense lines mapped to chart of accounts and tax codes']
        : ['1 unmapped category found: Travel needs GL account mapping'],
    };
  }

  async postExpense(
    payload: Record<string, unknown>,
    _accessToken: string,
    _orgId: string,
    idempotencyKey: string
  ): Promise<RemotePostingResult> {
    if (this.simulatedFailureMode === '429_RATE_LIMIT') {
      const error: any = new Error('429 Rate Limit Exceeded');
      error.status = 429;
      error.retryAfter = 60;
      throw error;
    }

    if (this.simulatedFailureMode === 'TIMEOUT') {
      const error: any = new Error('504 Gateway Timeout connecting to upstream server');
      error.status = 504;
      throw error;
    }

    // Check idempotency in mock
    const existing = Array.from(this.postedRecords.values()).find(
      (r) => r.remoteReference === idempotencyKey
    );
    if (existing) {
      return existing;
    }

    const externalId = `mock_exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const result: RemotePostingResult = {
      externalId,
      remoteReference: idempotencyKey,
      status: 'ACCEPTED',
      postedAt: new Date().toISOString(),
      responsePayload: payload,
    };

    this.postedRecords.set(externalId, result);
    return result;
  }

  async uploadReceipt(): Promise<void> {
    // Mock succeeds
  }

  async retrieveStatus(externalId: string): Promise<'ACCEPTED' | 'NOT_FOUND' | 'PENDING'> {
    return this.postedRecords.has(externalId) ? 'ACCEPTED' : 'NOT_FOUND';
  }

  async disconnect(): Promise<void> {
    this.postedRecords.clear();
  }
}
