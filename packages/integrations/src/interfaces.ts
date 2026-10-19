import { PostingPreview, ExternalMapping } from '@vyay/contracts';

export interface ConnectorCapabilities {
  supportsExpenses: boolean;
  supportsBills: boolean;
  supportsReceiptAttachment: boolean;
  supportsWebhooks: boolean;
  supportsTaxMapping: boolean;
  supportsVendorMapping: boolean;
  supportsProjectMapping: boolean;
}

export interface ConnectionHealth {
  connected: boolean;
  provider: string;
  externalOrgId?: string;
  externalOrgName?: string;
  expiresInSeconds?: number;
  scopes?: string[];
  lastCheckedAt: string;
  error?: string;
}

export interface ExternalAccount {
  id: string;
  name: string;
  code?: string;
  type: string;
}

export interface ExternalTax {
  id: string;
  name: string;
  rate: string;
}

export interface ExternalVendor {
  id: string;
  name: string;
  gstin?: string;
}

export interface ExternalReferenceData {
  accounts: ExternalAccount[];
  taxes: ExternalTax[];
  vendors: ExternalVendor[];
  projects: Array<{ id: string; name: string }>;
}

export interface RemotePostingResult {
  externalId: string;
  remoteReference: string;
  status: 'ACCEPTED' | 'REJECTED';
  postedAt: string;
  responsePayload: Record<string, unknown>;
}

export interface AccountingConnector {
  readonly name: string;
  readonly capabilities: ConnectorCapabilities;

  buildAuthUrl(tenantId: string, redirectUri: string, state: string): string;
  exchangeCode(tenantId: string, code: string, state: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    apiDomain?: string;
  }>;
  refreshToken(refreshToken: string, apiDomain?: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }>;
  testConnection(connectionId: string): Promise<ConnectionHealth>;
  listOrganizations(accessToken: string, apiDomain?: string): Promise<Array<{ id: string; name: string }>>;
  fetchReferenceData(accessToken: string, orgId: string, apiDomain?: string): Promise<ExternalReferenceData>;
  previewPosting(reportId: string, mappings: ExternalMapping[]): Promise<PostingPreview>;
  postExpense(payload: Record<string, unknown>, accessToken: string, orgId: string, idempotencyKey: string, apiDomain?: string): Promise<RemotePostingResult>;
  uploadReceipt?(externalExpenseId: string, receiptBuffer: Buffer, fileName: string, accessToken: string, orgId: string, apiDomain?: string): Promise<void>;
  retrieveStatus(externalId: string, accessToken: string, orgId: string, apiDomain?: string): Promise<'ACCEPTED' | 'NOT_FOUND' | 'PENDING'>;
  disconnect(connectionId: string): Promise<void>;
}
