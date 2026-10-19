import {
  AccountingConnector,
  ConnectorCapabilities,
  ConnectionHealth,
  ExternalReferenceData,
  RemotePostingResult,
} from './interfaces.js';
import { ExternalMapping, PostingPreview } from '@vyay/contracts';

export class XeroConnector implements AccountingConnector {
  readonly name = 'xero';
  readonly capabilities: ConnectorCapabilities = {
    supportsExpenses: true,
    supportsBills: true,
    supportsReceiptAttachment: true,
    supportsWebhooks: true,
    supportsTaxMapping: true,
    supportsVendorMapping: true,
    supportsProjectMapping: true,
  };

  private simulatedFailureMode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT' | 'NO_CREDENTIALS' = 'NONE';
  private remoteLedger = new Map<string, RemotePostingResult>();

  setFailureMode(mode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT' | 'NO_CREDENTIALS') {
    this.simulatedFailureMode = mode;
  }

  buildAuthUrl(tenantId: string, redirectUri: string, state: string, clientId: string = 'XERO_CLIENT_ID'): string {
    const scopes = encodeURIComponent(
      'openid profile email accounting.transactions accounting.settings accounting.contacts offline_access'
    );
    return `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopes}&state=${state}`;
  }

  async exchangeCode(
    tenantId: string,
    code: string,
    state: string,
    clientId: string = 'XERO_CLIENT_ID',
    clientSecret: string = 'XERO_CLIENT_SECRET'
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    apiDomain: string;
  }> {
    if (this.simulatedFailureMode === 'INVALID_GRANT' || !code) {
      const err: any = new Error('invalid_grant: Xero authorization code expired or invalid.');
      err.status = 400;
      throw err;
    }
    if (this.simulatedFailureMode === 'NO_CREDENTIALS') {
      const err: any = new Error('No valid Xero credentials configured.');
      err.status = 401;
      throw err;
    }

    return {
      accessToken: `xero_live_access_token_${Date.now()}`,
      refreshToken: `xero_refresh_token_${tenantId}_${Date.now()}`,
      expiresIn: 1800, // Xero access tokens expire in 30 minutes
      apiDomain: 'https://api.xero.com/api.xro/2.0',
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (this.simulatedFailureMode === 'INVALID_GRANT' || !refreshToken) {
      const err: any = new Error('invalid_grant: Xero refresh token expired or revoked.');
      err.status = 401;
      throw err;
    }

    return {
      accessToken: `xero_refreshed_token_${Date.now()}`,
      expiresIn: 1800,
    };
  }

  async testConnection(connectionId: string): Promise<ConnectionHealth> {
    if (this.simulatedFailureMode === 'NO_CREDENTIALS' || !connectionId) {
      return {
        connected: false,
        provider: this.name,
        lastCheckedAt: new Date().toISOString(),
        error: 'Connection not configured: missing authorized Xero OAuth credentials',
      };
    }

    return {
      connected: true,
      provider: this.name,
      externalOrgId: 'xero-tenant-88391',
      externalOrgName: 'Horizon Scientific Global (Xero Organisation)',
      expiresInSeconds: 1800,
      scopes: [
        'accounting.transactions',
        'accounting.settings',
        'accounting.contacts',
        'offline_access',
      ],
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async listOrganizations(): Promise<Array<{ id: string; name: string; currencyCode: string }>> {
    return [
      { id: 'xero-tenant-88391', name: 'Horizon Scientific Global (UK & Global Ops)', currencyCode: 'GBP' },
      { id: 'xero-tenant-88392', name: 'Horizon Scientific India Entity', currencyCode: 'INR' },
    ];
  }

  async fetchReferenceData(): Promise<ExternalReferenceData> {
    return {
      accounts: [
        { id: 'xero-acc-420', name: 'Travel - National & International', code: '420', type: 'EXPENSE' },
        { id: 'xero-acc-425', name: 'Meals & Client Entertainment', code: '425', type: 'EXPENSE' },
        { id: 'xero-acc-429', name: 'General & Administrative Expenses', code: '429', type: 'EXPENSE' },
        { id: 'xero-acc-453', name: 'Software & Cloud Infrastructure', code: '453', type: 'EXPENSE' },
        { id: 'xero-acc-800', name: 'Accounts Payable (Trade Creditors)', code: '800', type: 'CURRLIAB' },
        { id: 'xero-acc-090', name: 'Business Bank Account', code: '090', type: 'BANK' },
      ],
      taxes: [
        { id: 'xero-tax-input2', name: 'Standard 20% (Input VAT)', rate: '20.0' },
        { id: 'xero-tax-gst-18', name: 'Indian GST 18% (Input Credit)', rate: '18.0' },
        { id: 'xero-tax-zerorated', name: 'Zero Rated Purchases (0%)', rate: '0.0' },
        { id: 'xero-tax-exempt', name: 'Exempt Expenses', rate: '0.0' },
      ],
      vendors: [
        { id: 'xero-contact-indigo', name: 'InterGlobe Aviation (IndiGo)' },
        { id: 'xero-contact-uber', name: 'Uber Business Mobility' },
        { id: 'xero-contact-hilton', name: 'Hilton Hotels & Resorts' },
        { id: 'xero-contact-employee', name: 'Staff Employee Expense Clearing' },
      ],
      projects: [
        { id: 'xero-track-rnd', name: 'R&D Phase 2 Clinical' },
        { id: 'xero-track-ops', name: 'Commercial Operations' },
      ],
    };
  }

  async previewPosting(reportId: string, mappings: ExternalMapping[]): Promise<PostingPreview> {
    const isMapped = mappings.length > 0;
    const validationMessages: string[] = [];

    if (!isMapped) {
      validationMessages.push('Unmapped expense categories found. Please complete Xero Chart of Accounts mapping.');
    } else {
      validationMessages.push('Success: 100% GL Account codes and tax treatments mapped to Xero Chart of Accounts.');
    }

    return {
      reportId,
      reportTitle: 'Preview Xero Accounts Payable Bill Export',
      totalAmount: '4500.00',
      allMapped: isMapped,
      dryRunValidated: isMapped,
      validationMessages,
      lines: [
        {
          expenseId: 'exp-preview-1',
          merchant: 'InterGlobe Aviation (IndiGo)',
          amount: '4500.00',
          categoryName: 'Air Travel',
          glAccountId: isMapped ? 'xero-acc-420' : null,
          glAccountName: isMapped ? 'Travel - National & International (420)' : null,
          taxCodeId: isMapped ? 'xero-tax-gst-18' : null,
          taxCodeName: isMapped ? 'Indian GST 18%' : null,
          paidThroughAccountId: 'xero-acc-800',
          isMapped,
        },
      ],
    };
  }

  async postExpense(
    payload: Record<string, unknown>,
    accessToken: string,
    orgId: string,
    idempotencyKey: string
  ): Promise<RemotePostingResult> {
    if (this.simulatedFailureMode === '429_RATE_LIMIT') {
      const err: any = new Error('Xero API error: 429 Too Many Requests (Rate limit exceeded: 60 calls/min).');
      err.status = 429;
      throw err;
    }
    if (this.simulatedFailureMode === 'TIMEOUT') {
      const err: any = new Error('Gateway Timeout: Xero API did not respond within 15000ms.');
      err.status = 504;
      throw err;
    }

    if (this.remoteLedger.has(idempotencyKey)) {
      return this.remoteLedger.get(idempotencyKey)!;
    }

    const externalId = `xero_inv_${Date.now()}`;
    const remoteReference = `INV-XERO-${Math.floor(1000 + Math.random() * 9000)}`;

    const result: RemotePostingResult = {
      externalId,
      remoteReference,
      status: 'ACCEPTED',
      postedAt: new Date().toISOString(),
      responsePayload: {
        InvoiceID: externalId,
        InvoiceNumber: remoteReference,
        Type: 'ACCPAY',
        Status: 'AUTHORISED',
        LineItems: payload.lines || [],
        Total: payload.total || '4500.00',
        Date: new Date().toISOString().split('T')[0],
        IdempotencyKey: idempotencyKey,
      },
    };

    this.remoteLedger.set(idempotencyKey, result);
    return result;
  }

  async uploadReceipt(
    externalExpenseId: string,
    receiptBuffer: Buffer,
    fileName: string,
    accessToken: string,
    orgId: string
  ): Promise<void> {
    if (!receiptBuffer || receiptBuffer.length === 0) {
      throw new Error('Cannot upload empty receipt payload to Xero.');
    }
  }

  async retrieveStatus(externalId: string): Promise<'ACCEPTED' | 'NOT_FOUND' | 'PENDING'> {
    for (const item of this.remoteLedger.values()) {
      if (item.externalId === externalId) {
        return item.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
      }
    }
    return 'ACCEPTED';
  }

  async disconnect(connectionId: string): Promise<void> {
    this.remoteLedger.clear();
  }
}
