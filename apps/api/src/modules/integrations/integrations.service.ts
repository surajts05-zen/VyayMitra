import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ExternalMapping,
  UpdateMappingBatchInput,
  PostingPreview,
  IntegrationJobDto,
  PostingStatus,
  ZohoRegion,
  ZohoOrgDto,
  ReportStatus,
} from '@vyay/contracts';
import {
  ZohoBooksConnector,
  ConnectionHealth,
  ExternalReferenceData,
} from '@vyay/integrations';

interface IntegrationRecord {
  id: string;
  tenantId: string;
  provider: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  region: ZohoRegion;
  externalOrgId?: string;
  externalOrgName?: string;
  apiDomain?: string;
  connectedAt?: string;
  updatedAt: string;
}

interface OAuthCredentialRecord {
  id: string;
  integrationId: string;
  encryptedToken: string;
  scopes: string[];
  expiresAt: string;
}

@Injectable()
export class IntegrationsService {
  private integrations = new Map<string, IntegrationRecord>();
  private credentials = new Map<string, OAuthCredentialRecord>();
  private mappings = new Map<string, ExternalMapping[]>();
  private jobs = new Map<string, IntegrationJobDto[]>();
  private connectors = new Map<string, ZohoBooksConnector>();

  constructor() {
    this.seedDefaultData();
  }

  private getConnector(tenantId: string, region: ZohoRegion = ZohoRegion.IN): ZohoBooksConnector {
    const key = `${tenantId}_${region}`;
    if (!this.connectors.has(key)) {
      this.connectors.set(key, new ZohoBooksConnector(region, true));
    }
    return this.connectors.get(key)!;
  }

  private seedDefaultData() {
    const t1Id = '11111111-1111-1111-1111-111111111111'; // Acme BioTech Pvt Ltd
    const integrationId = '33333333-3333-3333-3333-333333333331';

    this.integrations.set(t1Id, {
      id: integrationId,
      tenantId: t1Id,
      provider: 'zoho_books',
      status: 'CONNECTED',
      region: ZohoRegion.IN,
      externalOrgId: 'zoho-org-891240',
      externalOrgName: 'Acme BioTech India Pvt Ltd (Primary)',
      apiDomain: 'https://books.zoho.in/api/v3',
      connectedAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-01T10:00:00.000Z',
    });

    this.credentials.set(integrationId, {
      id: randomUUID(),
      integrationId,
      encryptedToken: 'enc_sec_vault_refresh_token_acme_2026',
      scopes: [
        'ZohoBooks.expenses.ALL',
        'ZohoBooks.bills.ALL',
        'ZohoBooks.settings.READ',
        'ZohoBooks.contacts.READ',
      ],
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    // Seed default external mappings
    this.mappings.set(t1Id, [
      {
        id: randomUUID(),
        provider: 'zoho_books',
        localType: 'CATEGORY',
        localId: 'cat-air-travel',
        localName: 'Air Travel',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'zoho-acc-6010',
        externalName: 'Travel & Conveyance',
      },
      {
        id: randomUUID(),
        provider: 'zoho_books',
        localType: 'CATEGORY',
        localId: 'cat-ground-commute',
        localName: 'Ground Commute & Taxis',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'zoho-acc-6010',
        externalName: 'Travel & Conveyance',
      },
      {
        id: randomUUID(),
        provider: 'zoho_books',
        localType: 'CATEGORY',
        localId: 'cat-lodging',
        localName: 'Lodging & Accommodation',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'zoho-acc-6020',
        externalName: 'Lodging & Accommodation',
      },
      {
        id: randomUUID(),
        provider: 'zoho_books',
        localType: 'CATEGORY',
        localId: 'cat-meals',
        localName: 'Meals & Business Hospitality',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'zoho-acc-6030',
        externalName: 'Meals & Business Hospitality',
      },
      {
        id: randomUUID(),
        provider: 'zoho_books',
        localType: 'TAX',
        localId: 'tax-gst-18',
        localName: 'GST 18%',
        externalType: 'TAX_CODE',
        externalId: 'zoho-tax-gst-18',
        externalName: 'GST 18% (CGST 9% + SGST 9%)',
      },
    ]);
  }

  async getHealth(tenantId: string): Promise<ConnectionHealth> {
    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      return {
        connected: false,
        provider: 'zoho_books',
        lastCheckedAt: new Date().toISOString(),
        error: 'Connection not configured: missing authorized OAuth credentials',
      };
    }

    const connector = this.getConnector(tenantId, integration.region);
    const health = await connector.testConnection(integration.id);
    return {
      ...health,
      externalOrgId: integration.externalOrgId,
      externalOrgName: integration.externalOrgName,
    };
  }

  buildAuthUrl(
    tenantId: string,
    region: ZohoRegion = ZohoRegion.IN,
    redirectUri: string = 'https://app.vyaymitra.in/integrations/zoho/callback',
    clientId?: string
  ): { authUrl: string; state: string } {
    const connector = this.getConnector(tenantId, region);
    const state = `state_${tenantId}_${Date.now()}`;
    const authUrl = connector.buildAuthUrl(tenantId, redirectUri, state, clientId);
    return { authUrl, state };
  }

  async handleOAuthCallback(
    tenantId: string,
    code: string,
    state: string,
    region: ZohoRegion = ZohoRegion.IN,
    clientId?: string,
    clientSecret?: string
  ): Promise<{ status: string; integrationId: string; externalOrgName?: string }> {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }

    const connector = this.getConnector(tenantId, region);
    const tokens = await connector.exchangeCode(tenantId, code, state, clientId, clientSecret);

    let integration = this.integrations.get(tenantId);
    if (!integration) {
      integration = {
        id: randomUUID(),
        tenantId,
        provider: 'zoho_books',
        status: 'CONNECTED',
        region,
        apiDomain: tokens.apiDomain,
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.integrations.set(tenantId, integration);
    } else {
      integration.status = 'CONNECTED';
      integration.region = region;
      integration.apiDomain = tokens.apiDomain;
      integration.updatedAt = new Date().toISOString();
    }

    this.credentials.set(integration.id, {
      id: randomUUID(),
      integrationId: integration.id,
      encryptedToken: `aes_256_enc_${tokens.refreshToken}`,
      scopes: [
        'ZohoBooks.expenses.ALL',
        'ZohoBooks.bills.ALL',
        'ZohoBooks.settings.READ',
        'ZohoBooks.contacts.READ',
      ],
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
    });

    const orgs = await connector.listOrganizations();
    if (orgs.length > 0) {
      integration.externalOrgId = orgs[0].id;
      integration.externalOrgName = orgs[0].name;
    }

    return {
      status: 'CONNECTED',
      integrationId: integration.id,
      externalOrgName: integration.externalOrgName,
    };
  }

  async disconnect(tenantId: string): Promise<{ success: boolean; message: string }> {
    const integration = this.integrations.get(tenantId);
    if (!integration) {
      return { success: true, message: 'Already disconnected' };
    }

    integration.status = 'DISCONNECTED';
    integration.updatedAt = new Date().toISOString();
    this.credentials.delete(integration.id);

    return { success: true, message: 'Zoho Books connection revoked successfully' };
  }

  async listOrganizations(tenantId: string): Promise<ZohoOrgDto[]> {
    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      throw new BadRequestException('Zoho Books is not connected for this organization');
    }

    const connector = this.getConnector(tenantId, integration.region);
    const orgs = await connector.listOrganizations();

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      currencyCode: org.currencyCode || 'INR',
      country: 'India',
      isCurrent: org.id === integration.externalOrgId,
    }));
  }

  async selectOrganization(tenantId: string, orgId: string, orgName?: string): Promise<IntegrationRecord> {
    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      throw new BadRequestException('Zoho Books is not connected');
    }

    integration.externalOrgId = orgId;
    if (orgName) {
      integration.externalOrgName = orgName;
    }
    integration.updatedAt = new Date().toISOString();
    return integration;
  }

  async getReferenceData(tenantId: string): Promise<ExternalReferenceData> {
    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      throw new BadRequestException('Zoho Books is not connected');
    }

    const connector = this.getConnector(tenantId, integration.region);
    return connector.fetchReferenceData();
  }

  async getMappings(tenantId: string): Promise<ExternalMapping[]> {
    return this.mappings.get(tenantId) || [];
  }

  async updateMappings(tenantId: string, input: UpdateMappingBatchInput): Promise<ExternalMapping[]> {
    const existing = this.mappings.get(tenantId) || [];
    const updated = [...existing];

    for (const item of input.mappings) {
      const idx = updated.findIndex(
        (m) => m.localType === item.localType && m.localId === item.localId
      );
      const newMapping: ExternalMapping = {
        id: idx >= 0 ? updated[idx].id : randomUUID(),
        provider: 'zoho_books',
        localType: item.localType,
        localId: item.localId,
        localName: item.localId,
        externalType: item.externalType,
        externalId: item.externalId,
        externalName: item.externalName,
      };

      if (idx >= 0) {
        updated[idx] = newMapping;
      } else {
        updated.push(newMapping);
      }
    }

    this.mappings.set(tenantId, updated);
    return updated;
  }

  async validateAndDryRun(tenantId: string, reportId: string): Promise<PostingPreview> {
    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      return {
        reportId,
        reportTitle: 'Unconnected Report Preview',
        totalAmount: '0.00',
        lines: [],
        allMapped: false,
        dryRunValidated: false,
        validationMessages: ['Zoho Books connection not active. Connect Zoho Books to validate ledger posting.'],
      };
    }

    const connector = this.getConnector(tenantId, integration.region);
    const tenantMappings = this.mappings.get(tenantId) || [];
    return connector.previewPosting(reportId, tenantMappings);
  }

  async exportReport(
    tenantId: string,
    reportId: string,
    exportMode: 'EXPENSE' | 'BILL' = 'BILL',
    dryRun: boolean = false
  ): Promise<{
    jobId: string;
    status: PostingStatus;
    remoteReference?: string;
    message: string;
    dryRunPreview?: PostingPreview;
  }> {
    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      throw new BadRequestException('Zoho Books is not connected for this organization');
    }

    // Dry Run check
    if (dryRun) {
      const preview = await this.validateAndDryRun(tenantId, reportId);
      return {
        jobId: randomUUID(),
        status: PostingStatus.NOT_QUEUED,
        message: 'Dry run completed successfully. No ledger postings were committed.',
        dryRunPreview: preview,
      };
    }

    // Idempotency check: Have we already exported this report?
    const existingJobs = this.jobs.get(tenantId) || [];
    const alreadyExported = existingJobs.find(
      (j) => j.entityId === reportId && j.status === PostingStatus.SYNCED
    );

    if (alreadyExported) {
      return {
        jobId: alreadyExported.id,
        status: PostingStatus.SYNCED,
        remoteReference: alreadyExported.remoteReference ?? undefined,
        message: 'Report was already exported to Zoho Books. Returned cached ledger reference.',
      };
    }

    // Create tracking job
    const jobId = randomUUID();
    const idempotencyKey = `idemp_zoho_${tenantId}_${reportId}_${exportMode}`;
    const newJob: IntegrationJobDto = {
      id: jobId,
      tenantId,
      provider: 'zoho_books',
      entityType: 'EXPENSE_REPORT',
      entityId: reportId,
      status: PostingStatus.SYNCING,
      attempts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!this.jobs.has(tenantId)) {
      this.jobs.set(tenantId, []);
    }
    this.jobs.get(tenantId)!.unshift(newJob);

    // Call connector
    const connector = this.getConnector(tenantId, integration.region);
    try {
      const payload = {
        reportId,
        exportMode,
        externalOrgId: integration.externalOrgId,
        exportedAt: new Date().toISOString(),
      };

      const result = await connector.postExpense(
        payload,
        'zoho_mock_live_token',
        integration.externalOrgId || 'zoho-org-891240',
        idempotencyKey
      );

      newJob.status = PostingStatus.SYNCED;
      newJob.remoteReference = result.externalId;
      newJob.updatedAt = new Date().toISOString();

      return {
        jobId: newJob.id,
        status: PostingStatus.SYNCED,
        remoteReference: result.externalId,
        message: `Successfully posted ${exportMode} to Zoho Books with remote ID: ${result.externalId}`,
      };
    } catch (err: any) {
      newJob.status = PostingStatus.RETRYABLE_FAILURE;
      newJob.lastError = err.message || 'Unknown error exporting to Zoho Books';
      newJob.updatedAt = new Date().toISOString();

      if (err.status === 429) {
        throw new BadRequestException(
          `Zoho Books API rate limit exceeded. Retry after ${err.retryAfter || 60} seconds.`
        );
      }

      throw new BadRequestException(`Export failed: ${newJob.lastError}`);
    }
  }

  async getJobs(tenantId: string): Promise<IntegrationJobDto[]> {
    return this.jobs.get(tenantId) || [];
  }

  async retryJob(tenantId: string, jobId: string): Promise<IntegrationJobDto> {
    const jobs = this.jobs.get(tenantId) || [];
    const job = jobs.find((j) => j.id === jobId);
    if (!job) {
      throw new NotFoundException(`Integration job ${jobId} not found`);
    }

    job.attempts += 1;
    job.status = PostingStatus.SYNCING;
    job.lastError = null;
    job.updatedAt = new Date().toISOString();

    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      job.status = PostingStatus.RETRYABLE_FAILURE;
      job.lastError = 'Zoho Books connection not active';
      throw new BadRequestException('Zoho Books connection not active');
    }

    const connector = this.getConnector(tenantId, integration.region);
    try {
      const result = await connector.postExpense(
        { reportId: job.entityId },
        'zoho_mock_live_token',
        integration.externalOrgId || 'zoho-org-891240',
        `idemp_retry_${job.id}_${job.attempts}`
      );

      job.status = PostingStatus.SYNCED;
      job.remoteReference = result.externalId;
      job.updatedAt = new Date().toISOString();
      return job;
    } catch (err: any) {
      job.status = PostingStatus.RETRYABLE_FAILURE;
      job.lastError = err.message;
      job.updatedAt = new Date().toISOString();
      throw new BadRequestException(`Retry failed: ${err.message}`);
    }
  }

  // Helper method for testing failure scenarios
  setConnectorFailureMode(
    tenantId: string,
    mode: 'NONE' | '429_RATE_LIMIT' | 'TIMEOUT' | 'INVALID_GRANT' | 'NO_CREDENTIALS',
    region: ZohoRegion = ZohoRegion.IN
  ) {
    const connector = this.getConnector(tenantId, region);
    connector.setFailureMode(mode);
  }
}
