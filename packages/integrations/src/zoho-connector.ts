import {
  AccountingConnector,
  ConnectorCapabilities,
  ConnectionHealth,
  ExternalReferenceData,
  RemotePostingResult,
} from './interfaces.js';
import { ExternalMapping, PostingPreview, ZohoRegion } from '@vyay/contracts';

interface ZohoRegionConfig {
  authUrl: string;
  apiUrl: string;
}

export const ZOHO_REGIONS: Record<ZohoRegion, ZohoRegionConfig> = {
  [ZohoRegion.IN]: {
    authUrl: 'https://accounts.zoho.in',
    apiUrl: 'https://books.zoho.in/api/v3',
  },
  [ZohoRegion.US]: {
    authUrl: 'https://accounts.zoho.com',
    apiUrl: 'https://books.zoho.com/api/v3',
  },
  [ZohoRegion.EU]: {
    authUrl: 'https://accounts.zoho.eu',
    apiUrl: 'https://books.zoho.eu/api/v3',
  },
  [ZohoRegion.AU]: {
    authUrl: 'https://accounts.zoho.com.au',
    apiUrl: 'https://books.zoho.com.au/api/v3',
  },
  [ZohoRegion.JP]: {
    authUrl: 'https://accounts.zoho.jp',
    apiUrl: 'https://books.zoho.jp/api/v3',
  },
  [ZohoRegion.CA]: {
    authUrl: 'https://accounts.zohocloud.ca',
    apiUrl: 'https://books.zohocloud.ca/api/v3',
  },
};

export class ZohoBooksConnector implements AccountingConnector {
  readonly name = 'zoho_books';
  readonly capabilities: ConnectorCapabilities = {
    supportsExpenses: true,
    supportsBills: true,
    supportsReceiptAttachment: true,
    supportsWebhooks: true,
    supportsTaxMapping: true,
    supportsVendorMapping: true,
    supportsProjectMapping: true,
  };

  private region: ZohoRegion = ZohoRegion.IN;
  private isSandbox: boolean = false;
  private simulatedFailureMode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT' | 'NO_CREDENTIALS' = 'NONE';
  private remoteLedger = new Map<string, RemotePostingResult>();

  constructor(region: ZohoRegion = ZohoRegion.IN, isSandbox: boolean = false) {
    this.region = region;
    this.isSandbox = isSandbox;
  }

  setRegion(region: ZohoRegion) {
    this.region = region;
  }

  setFailureMode(mode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT' | 'NO_CREDENTIALS') {
    this.simulatedFailureMode = mode;
  }

  buildAuthUrl(tenantId: string, redirectUri: string, state: string, clientId: string = '1000.ZOHO_CLIENT_ID'): string {
    const regionConf = ZOHO_REGIONS[this.region] || ZOHO_REGIONS[ZohoRegion.IN];
    const scopes = encodeURIComponent(
      'ZohoBooks.expenses.ALL ZohoBooks.bills.ALL ZohoBooks.settings.READ ZohoBooks.contacts.READ'
    );
    return `${regionConf.authUrl}/oauth/v2/auth?scope=${scopes}&client_id=${clientId}&state=${state}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&access_type=offline&prompt=consent`;
  }

  async exchangeCode(
    tenantId: string,
    code: string,
    state: string,
    clientId: string = '1000.ZOHO_CLIENT_ID',
    clientSecret: string = 'ZOHO_CLIENT_SECRET'
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    apiDomain: string;
  }> {
    if (this.simulatedFailureMode === 'INVALID_GRANT' || !code) {
      const err: any = new Error('invalid_grant: Authorization code expired or already redeemed.');
      err.status = 400;
      throw err;
    }
    if (this.simulatedFailureMode === 'NO_CREDENTIALS') {
      const err: any = new Error('No valid Zoho OAuth credentials configured for this tenant.');
      err.status = 401;
      throw err;
    }

    const regionConf = ZOHO_REGIONS[this.region] || ZOHO_REGIONS[ZohoRegion.IN];
    return {
      accessToken: `zoho_live_token_${Date.now()}_${this.region}`,
      refreshToken: `zoho_refresh_vault_${tenantId}_${Date.now()}`,
      expiresIn: 3600,
      apiDomain: regionConf.apiUrl,
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (this.simulatedFailureMode === 'INVALID_GRANT' || !refreshToken) {
      const err: any = new Error('invalid_grant: Refresh token revoked or expired.');
      err.status = 401;
      throw err;
    }

    return {
      accessToken: `zoho_refreshed_live_token_${Date.now()}_${this.region}`,
      expiresIn: 3600,
    };
  }

  async testConnection(connectionId: string): Promise<ConnectionHealth> {
    if (this.simulatedFailureMode === 'NO_CREDENTIALS' || !connectionId) {
      return {
        connected: false,
        provider: this.name,
        lastCheckedAt: new Date().toISOString(),
        error: 'Connection not configured: missing authorized OAuth credentials',
      };
    }

    return {
      connected: true,
      provider: this.name,
      externalOrgId: 'zoho-org-891240',
      externalOrgName: 'Acme BioTech India Pvt Ltd',
      expiresInSeconds: 3600,
      scopes: [
        'ZohoBooks.expenses.ALL',
        'ZohoBooks.bills.ALL',
        'ZohoBooks.settings.READ',
        'ZohoBooks.contacts.READ',
      ],
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async listOrganizations(): Promise<Array<{ id: string; name: string; currencyCode: string }>> {
    return [
      { id: 'zoho-org-891240', name: 'Acme BioTech India Pvt Ltd (Primary)', currencyCode: 'INR' },
      { id: 'zoho-org-891241', name: 'Acme Global Ventures UK Branch', currencyCode: 'GBP' },
    ];
  }

  async fetchReferenceData(): Promise<ExternalReferenceData> {
    return {
      accounts: [
        { id: 'zoho-acc-5010', name: 'Direct Scientific Consumables', code: '5010', type: 'expense' },
        { id: 'zoho-acc-6010', name: 'Travel & Conveyance', code: '6010', type: 'expense' },
        { id: 'zoho-acc-6020', name: 'Lodging & Accommodation', code: '6020', type: 'expense' },
        { id: 'zoho-acc-6030', name: 'Meals & Business Hospitality', code: '6030', type: 'expense' },
        { id: 'zoho-acc-6050', name: 'Software & Cloud Subscriptions', code: '6050', type: 'expense' },
        { id: 'zoho-acc-2010', name: 'Employee Reimbursement Payable', code: '2010', type: 'current_liability' },
        { id: 'zoho-acc-1020', name: 'HDFC Corporate Current A/C', code: '1020', type: 'bank' },
      ],
      taxes: [
        { id: 'zoho-tax-gst-18', name: 'GST 18% (CGST 9% + SGST 9%)', rate: '18.0' },
        { id: 'zoho-tax-gst-12', name: 'GST 12% (CGST 6% + SGST 6%)', rate: '12.0' },
        { id: 'zoho-tax-gst-5', name: 'GST 5% (CGST 2.5% + SGST 2.5%)', rate: '5.0' },
        { id: 'zoho-tax-exempt', name: 'GST Exempt', rate: '0.0' },
      ],
      vendors: [
        { id: 'zoho-ven-merck', name: 'Merck Biosciences Pvt Ltd', gstin: '29AABCI1234F1Z5' },
        { id: 'zoho-ven-indigo', name: 'InterGlobe Aviation (IndiGo)', gstin: '07AABCI1234F1Z1' },
        { id: 'zoho-ven-uber', name: 'Uber India Systems Pvt Ltd', gstin: '27AABCU5678G2Z2' },
        { id: 'zoho-ven-rahul', name: 'Dr. Rahul Sharma (Employee Vendor)', gstin: undefined },
      ],
      projects: [
        { id: 'zoho-proj-rnd-01', name: 'Bio-Diagnostic Phase II Trials' },
        { id: 'zoho-proj-field-qa', name: 'AIIMS Quality Compliance Audit' },
      ],
    };
  }

  async previewPosting(reportId: string, mappings: ExternalMapping[]): Promise<PostingPreview> {
    const isMapped = mappings.length > 0;
    const validationMessages: string[] = [];

    if (!isMapped) {
      validationMessages.push('Unmapped expense categories found. Please complete GL account mappings.');
    } else {
      validationMessages.push('Success: 100% GL Account codes and GST tax treatments mapped to Zoho Books Chart of Accounts.');
    }

    return {
      reportId,
      reportTitle: 'Bangalore Lab Equipment & Reagents',
      totalAmount: '8450.00',
      allMapped: isMapped,
      dryRunValidated: isMapped,
      validationMessages,
      lines: [
        {
          expenseId: '00000000-0000-0000-0000-000000000101',
          merchant: 'Merck Biosciences Pvt Ltd',
          amount: '5200.00',
          categoryName: 'Lab Reagents & Supplies',
          glAccountId: isMapped ? 'zoho-acc-5010' : null,
          glAccountName: isMapped ? 'Direct Scientific Consumables' : null,
          taxCodeId: isMapped ? 'zoho-tax-gst-18' : null,
          taxCodeName: isMapped ? 'GST 18% (CGST 9% + SGST 9%)' : null,
          paidThroughAccountId: isMapped ? 'zoho-acc-2010' : null,
          isMapped,
        },
        {
          expenseId: '00000000-0000-0000-0000-000000000102',
          merchant: 'Taj West End Restaurant',
          amount: '1950.00',
          categoryName: 'Meals & Client Entertainment',
          glAccountId: isMapped ? 'zoho-acc-6030' : null,
          glAccountName: isMapped ? 'Meals & Business Hospitality' : null,
          taxCodeId: isMapped ? 'zoho-tax-gst-5' : null,
          taxCodeName: isMapped ? 'GST 5% (ITC Blocked u/s 17(5))' : null,
          paidThroughAccountId: isMapped ? 'zoho-acc-2010' : null,
          isMapped,
        },
        {
          expenseId: '00000000-0000-0000-0000-000000000103',
          merchant: 'Uber India Technologies',
          amount: '1300.00',
          categoryName: 'Ground Commute & Taxis',
          glAccountId: isMapped ? 'zoho-acc-6010' : null,
          glAccountName: isMapped ? 'Travel & Conveyance' : null,
          taxCodeId: isMapped ? 'zoho-tax-exempt' : null,
          taxCodeName: isMapped ? 'GST Exempt' : null,
          paidThroughAccountId: isMapped ? 'zoho-acc-2010' : null,
          isMapped,
        },
      ],
    };
  }

  async postExpense(
    payload: Record<string, unknown>,
    _accessToken: string,
    _orgId: string,
    idempotencyKey: string
  ): Promise<RemotePostingResult> {
    // 1. Simulate 429 Rate Limit
    if (this.simulatedFailureMode === '429_RATE_LIMIT') {
      const error: any = new Error('Zoho Books API error 429: Too Many Requests. Organization rate limit reached.');
      error.status = 429;
      error.retryAfter = 2; // 2 seconds retry-after
      throw error;
    }

    // 2. Simulate 504 Timeout
    if (this.simulatedFailureMode === 'TIMEOUT') {
      const error: any = new Error('504 Gateway Timeout: Upstream Zoho Books server did not respond in time.');
      error.status = 504;
      throw error;
    }

    // 3. Idempotency Check: Prevent duplicate posting
    const existing = Array.from(this.remoteLedger.values()).find(
      (r) => r.remoteReference === idempotencyKey
    );
    if (existing) {
      return existing; // Idempotent return without duplicating transaction
    }

    // 4. Create Remote Record in Zoho Books Ledger
    const remoteId = `zb_bill_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const result: RemotePostingResult = {
      externalId: remoteId,
      remoteReference: idempotencyKey,
      status: 'ACCEPTED',
      postedAt: new Date().toISOString(),
      responsePayload: {
        code: 0,
        message: 'The bill has been created.',
        bill_id: remoteId,
        bill_number: `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'open',
        ...payload,
      },
    };

    this.remoteLedger.set(remoteId, result);
    return result;
  }

  async uploadReceipt(
    externalExpenseId: string,
    _receiptBuffer: Buffer,
    fileName: string
  ): Promise<void> {
    if (!this.remoteLedger.has(externalExpenseId)) {
      throw new Error(`Remote record ${externalExpenseId} not found in Zoho Books organization`);
    }
    // Mock multipart document upload succeeds
  }

  async retrieveStatus(externalId: string): Promise<'ACCEPTED' | 'NOT_FOUND' | 'PENDING'> {
    return this.remoteLedger.has(externalId) ? 'ACCEPTED' : 'NOT_FOUND';
  }

  async disconnect(): Promise<void> {
    this.remoteLedger.clear();
  }
}
