import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
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
  XeroConnector,
  TallyPrimeConnector,
  ConnectionHealth,
  ExternalReferenceData,
} from '@vyay/integrations';
import {
  TallyXmlExportRequest,
  TallyVoucherType,
} from '@vyay/contracts';

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
  private xeroConnectors = new Map<string, XeroConnector>();
  private tallyConnectors = new Map<string, TallyPrimeConnector>();

  constructor(@Optional() private readonly prisma?: PrismaService) {
    this.seedDefaultData();
  }

  private getConnector(tenantId: string, region: ZohoRegion = ZohoRegion.IN): ZohoBooksConnector {
    const key = `${tenantId}_${region}`;
    if (!this.connectors.has(key)) {
      this.connectors.set(key, new ZohoBooksConnector(region, true));
    }
    return this.connectors.get(key)!;
  }

  public getXeroConnector(tenantId: string): XeroConnector {
    if (!this.xeroConnectors.has(tenantId)) {
      this.xeroConnectors.set(tenantId, new XeroConnector());
    }
    return this.xeroConnectors.get(tenantId)!;
  }

  public getTallyConnector(tenantId: string): TallyPrimeConnector {
    if (!this.tallyConnectors.has(tenantId)) {
      this.tallyConnectors.set(tenantId, new TallyPrimeConnector());
    }
    return this.tallyConnectors.get(tenantId)!;
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
      // Seed default Xero mappings
      {
        id: randomUUID(),
        provider: 'xero',
        localType: 'CATEGORY',
        localId: 'cat-air-travel',
        localName: 'Air Travel',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'xero-acc-420',
        externalName: 'Travel - National & International (420)',
      },
      {
        id: randomUUID(),
        provider: 'xero',
        localType: 'CATEGORY',
        localId: 'cat-meals',
        localName: 'Meals & Business Hospitality',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'xero-acc-425',
        externalName: 'Meals & Client Entertainment (425)',
      },
      {
        id: randomUUID(),
        provider: 'xero',
        localType: 'TAX',
        localId: 'tax-gst-18',
        localName: 'GST 18%',
        externalType: 'TAX_CODE',
        externalId: 'xero-tax-gst-18',
        externalName: 'Indian GST 18%',
      },
      // Seed default Tally Prime mappings
      {
        id: randomUUID(),
        provider: 'tally_prime',
        localType: 'CATEGORY',
        localId: 'cat-air-travel',
        localName: 'Air Travel',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'tally-led-travelling',
        externalName: 'Travelling Expenses',
      },
      {
        id: randomUUID(),
        provider: 'tally_prime',
        localType: 'CATEGORY',
        localId: 'cat-lodging',
        localName: 'Lodging & Accommodation',
        externalType: 'CHART_OF_ACCOUNT',
        externalId: 'tally-led-lodging',
        externalName: 'Hotel & Lodging Expenses',
      },
      {
        id: randomUUID(),
        provider: 'tally_prime',
        localType: 'TAX',
        localId: 'tax-gst-18',
        localName: 'GST 18%',
        externalType: 'TAX_CODE',
        externalId: 'tally-led-cgst',
        externalName: 'Input CGST @ 9%',
      },
    ]);
  }

  listSupportedProviders() {
    return [
      {
        id: 'zoho_books',
        name: 'Zoho Books',
        type: 'CLOUD_OAUTH',
        description: 'Multi-datacenter cloud ERP with Chart of Accounts, bills, expenses, and GST tax codes.',
        regions: ['IN', 'US', 'EU', 'AU', 'JP', 'CA'],
        status: 'CONNECTED',
      },
      {
        id: 'xero',
        name: 'Xero Accounting',
        type: 'CLOUD_OAUTH',
        description: 'Global cloud accounting software with ACCPAY Bills, Expense Claims, and Tracking Categories.',
        regions: ['GLOBAL'],
        status: 'CONNECTED',
      },
      {
        id: 'tally_prime',
        name: 'Tally Prime',
        type: 'XML_GATEWAY',
        description: 'Premier Indian enterprise ERP with direct XML voucher download, HTTP gateway sync, and balanced Dr/Cr ledgers.',
        regions: ['IN'],
        status: 'CONNECTED',
      },
    ];
  }

  async getHealth(tenantId: string, provider: string = 'zoho_books'): Promise<ConnectionHealth> {
    if (provider === 'xero') {
      return this.getXeroConnector(tenantId).testConnection('xero-conn-default');
    }
    if (provider === 'tally_prime') {
      return this.getTallyConnector(tenantId).testConnection('tally-conn-default');
    }

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

  buildXeroAuthUrl(
    tenantId: string,
    redirectUri: string = 'https://app.vyaymitra.in/integrations/xero/callback',
    clientId?: string
  ): { authUrl: string; state: string } {
    const connector = this.getXeroConnector(tenantId);
    const state = `state_xero_${tenantId}_${Date.now()}`;
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

    if (this.prisma?.isConnected) {
      try {
        const dbIntegration = await this.prisma.integration.upsert({
          where: {
            tenantId_provider: {
              tenantId,
              provider: 'zoho_books',
            },
          },
          update: {
            status: 'CONNECTED',
            apiDomain: tokens.apiDomain,
            externalOrgId: integration.externalOrgId,
          },
          create: {
            id: integration.id,
            tenantId,
            provider: 'zoho_books',
            status: 'CONNECTED',
            apiDomain: tokens.apiDomain,
            externalOrgId: integration.externalOrgId,
          },
        });
        await this.prisma.oAuthCredential.upsert({
          where: { integrationId: dbIntegration.id },
          update: {
            encryptedToken: `aes_256_enc_${tokens.refreshToken}`,
            scopes: JSON.stringify([
              'ZohoBooks.expenses.ALL',
              'ZohoBooks.bills.ALL',
              'ZohoBooks.settings.READ',
              'ZohoBooks.contacts.READ',
            ]),
            tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          },
          create: {
            integrationId: dbIntegration.id,
            encryptedToken: `aes_256_enc_${tokens.refreshToken}`,
            scopes: JSON.stringify([
              'ZohoBooks.expenses.ALL',
              'ZohoBooks.bills.ALL',
              'ZohoBooks.settings.READ',
              'ZohoBooks.contacts.READ',
            ]),
            tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          },
        });
      } catch (err: any) {
        // Fallback gracefully to in-memory store
      }
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

    if (this.prisma?.isConnected) {
      try {
        await this.prisma.integration.updateMany({
          where: { tenantId, provider: 'zoho_books' },
          data: { status: 'DISCONNECTED' },
        });
      } catch {
        // Fallback
      }
    }

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

  async getReferenceData(tenantId: string, provider: string = 'zoho_books'): Promise<ExternalReferenceData> {
    if (provider === 'xero') {
      return this.getXeroConnector(tenantId).fetchReferenceData();
    }
    if (provider === 'tally_prime') {
      return this.getTallyConnector(tenantId).fetchReferenceData();
    }

    const integration = this.integrations.get(tenantId);
    if (!integration || integration.status !== 'CONNECTED') {
      throw new BadRequestException('Zoho Books is not connected');
    }

    const connector = this.getConnector(tenantId, integration.region);
    return connector.fetchReferenceData();
  }

  async getMappings(tenantId: string, provider?: string): Promise<ExternalMapping[]> {
    const list = this.mappings.get(tenantId) || [];
    if (provider) {
      return list.filter((m) => m.provider === provider);
    }
    return list;
  }

  async updateMappings(
    tenantId: string,
    input: UpdateMappingBatchInput,
    provider: string = 'zoho_books'
  ): Promise<ExternalMapping[]> {
    const existing = this.mappings.get(tenantId) || [];
    const updated = [...existing];

    for (const item of input.mappings) {
      const idx = updated.findIndex(
        (m) => m.provider === provider && m.localType === item.localType && m.localId === item.localId
      );
      const newMapping: ExternalMapping = {
        id: idx >= 0 ? updated[idx].id : randomUUID(),
        provider,
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

    if (this.prisma?.isConnected) {
      try {
        let dbInteg = await this.prisma.integration.findUnique({
          where: { tenantId_provider: { tenantId, provider } },
        });
        if (!dbInteg) {
          dbInteg = await this.prisma.integration.create({
            data: {
              tenantId,
              provider,
              status: 'CONNECTED',
            },
          });
        }
        for (const item of input.mappings) {
          await this.prisma.externalMapping.upsert({
            where: {
              integrationId_localType_localId: {
                integrationId: dbInteg.id,
                localType: item.localType,
                localId: item.localId,
              },
            },
            update: {
              externalType: item.externalType,
              externalId: item.externalId,
              externalName: item.externalName,
            },
            create: {
              tenantId,
              integrationId: dbInteg.id,
              provider,
              localType: item.localType,
              localId: item.localId,
              externalType: item.externalType,
              externalId: item.externalId,
              externalName: item.externalName,
            },
          });
        }
      } catch {
        // Fallback gracefully
      }
    }

    return updated.filter((m) => m.provider === provider);
  }

  async validateAndDryRun(
    tenantId: string,
    reportId: string,
    provider: string = 'zoho_books'
  ): Promise<PostingPreview> {
    const tenantMappings = (this.mappings.get(tenantId) || []).filter((m) => m.provider === provider);

    if (provider === 'xero') {
      return this.getXeroConnector(tenantId).previewPosting(reportId, tenantMappings);
    }
    if (provider === 'tally_prime') {
      return this.getTallyConnector(tenantId).previewPosting(reportId, tenantMappings);
    }

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
    return connector.previewPosting(reportId, tenantMappings);
  }

  async exportReport(
    tenantId: string,
    reportId: string,
    exportMode: 'EXPENSE' | 'BILL' = 'BILL',
    dryRun: boolean = false,
    provider: string = 'zoho_books'
  ): Promise<{
    jobId: string;
    status: PostingStatus;
    remoteReference?: string;
    message: string;
    dryRunPreview?: PostingPreview;
  }> {
    if (dryRun) {
      const preview = await this.validateAndDryRun(tenantId, reportId, provider);
      return {
        jobId: randomUUID(),
        status: PostingStatus.NOT_QUEUED,
        message: `Dry run completed successfully for ${provider}. No ledger postings were committed.`,
        dryRunPreview: preview,
      };
    }

    // Idempotency check: Have we already exported this report to this provider?
    const existingJobs = this.jobs.get(tenantId) || [];
    const alreadyExported = existingJobs.find(
      (j) => j.entityId === reportId && j.provider === provider && j.status === PostingStatus.SYNCED
    );

    if (alreadyExported) {
      return {
        jobId: alreadyExported.id,
        status: PostingStatus.SYNCED,
        remoteReference: alreadyExported.remoteReference ?? undefined,
        message: `Report was already exported to ${provider}. Returned cached ledger reference.`,
      };
    }

    // Create tracking job
    const jobId = randomUUID();
    const idempotencyKey = `idemp_${provider}_${tenantId}_${reportId}_${exportMode}`;
    const newJob: IntegrationJobDto = {
      id: jobId,
      tenantId,
      provider,
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

    try {
      let result;
      if (provider === 'xero') {
        const connector = this.getXeroConnector(tenantId);
        result = await connector.postExpense(
          { reportId, exportMode, total: '4500.00' },
          'xero_mock_token',
          'xero-tenant-88391',
          idempotencyKey
        );
      } else if (provider === 'tally_prime') {
        const connector = this.getTallyConnector(tenantId);
        result = await connector.postExpense(
          { reportId, voucherType: 'Payment', total: '4500.00' },
          'tally_mock_token',
          'tally-comp-primary',
          idempotencyKey
        );
      } else {
        const integration = this.integrations.get(tenantId);
        if (!integration || integration.status !== 'CONNECTED') {
          throw new BadRequestException('Zoho Books is not connected for this organization');
        }
        const connector = this.getConnector(tenantId, integration.region);
        result = await connector.postExpense(
          {
            reportId,
            exportMode,
            externalOrgId: integration.externalOrgId,
            exportedAt: new Date().toISOString(),
          },
          'zoho_mock_live_token',
          integration.externalOrgId || 'zoho-org-891240',
          idempotencyKey
        );
      }

      newJob.status = PostingStatus.SYNCED;
      newJob.remoteReference = result.externalId;
      newJob.updatedAt = new Date().toISOString();

      if (this.prisma?.isConnected) {
        try {
          let dbInteg = await this.prisma.integration.findUnique({
            where: { tenantId_provider: { tenantId, provider } },
          });
          if (!dbInteg) {
            dbInteg = await this.prisma.integration.create({
              data: {
                tenantId,
                provider,
                status: 'CONNECTED',
              },
            });
          }
          await this.prisma.integrationJob.upsert({
            where: { idempotencyKey },
            update: {
              status: newJob.status,
              remoteReference: newJob.remoteReference,
              lastError: newJob.lastError,
              completedAt: new Date(),
            },
            create: {
              id: jobId,
              tenantId,
              integrationId: dbInteg.id,
              entityType: 'EXPENSE_REPORT',
              entityId: reportId,
              idempotencyKey,
              status: newJob.status,
              remoteReference: newJob.remoteReference,
              lastError: newJob.lastError,
              completedAt: new Date(),
            },
          });
        } catch {
          // Fallback
        }
      }

      return {
        jobId: newJob.id,
        status: PostingStatus.SYNCED,
        remoteReference: newJob.remoteReference,
        message: `Successfully posted ${exportMode} to ${provider} with remote reference: ${newJob.remoteReference}`,
      };
    } catch (err: any) {
      newJob.status = PostingStatus.RETRYABLE_FAILURE;
      newJob.lastError = err.message || `Unknown error exporting to ${provider}`;
      newJob.updatedAt = new Date().toISOString();

      if (this.prisma?.isConnected) {
        try {
          let dbInteg = await this.prisma.integration.findUnique({
            where: { tenantId_provider: { tenantId, provider } },
          });
          if (!dbInteg) {
            dbInteg = await this.prisma.integration.create({
              data: {
                tenantId,
                provider,
                status: 'CONNECTED',
              },
            });
          }
          await this.prisma.integrationJob.upsert({
            where: { idempotencyKey },
            update: {
              status: newJob.status,
              lastError: newJob.lastError,
            },
            create: {
              id: jobId,
              tenantId,
              integrationId: dbInteg.id,
              entityType: 'EXPENSE_REPORT',
              entityId: reportId,
              idempotencyKey,
              status: newJob.status,
              lastError: newJob.lastError,
            },
          });
        } catch {
          // Fallback
        }
      }

      if (err.status === 429) {
        throw new BadRequestException(
          `${provider} API rate limit exceeded. Retry after ${err.retryAfter || 60} seconds.`
        );
      }

      throw new BadRequestException(`Export failed: ${newJob.lastError}`);
    }
  }

  async exportTallyXml(
    tenantId: string,
    input: TallyXmlExportRequest
  ): Promise<{
    voucherNumber: string;
    xmlContent: string;
    status: PostingStatus;
    directSync: boolean;
    message: string;
  }> {
    const connector = this.getTallyConnector(tenantId);
    const postResult = await connector.postExpense(
      {
        reportId: input.reportId,
        voucherType: input.voucherType,
        bankLedger: input.cashBankLedger,
        total: '4500.00',
      },
      'token',
      input.companyName,
      `idemp_tally_xml_${input.reportId}_${Date.now()}`
    );

    const xmlPayload = (postResult.responsePayload?.xmlPayload as string) || '';

    return {
      voucherNumber: postResult.remoteReference,
      xmlContent: xmlPayload,
      status: PostingStatus.SYNCED,
      directSync: input.directSync,
      message: input.directSync
        ? `XML voucher ${postResult.remoteReference} successfully transmitted to Tally Prime HTTP server.`
        : `Tally XML voucher ${postResult.remoteReference} generated and ready for file import.`,
    };
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

      if (this.prisma?.isConnected) {
        try {
          await this.prisma.integrationJob.update({
            where: { id: jobId },
            data: {
              attempts: job.attempts,
              status: job.status,
              remoteReference: job.remoteReference,
              lastError: job.lastError,
              completedAt: new Date(),
            },
          });
        } catch {
          // Fallback
        }
      }

      return job;
    } catch (err: any) {
      job.status = PostingStatus.RETRYABLE_FAILURE;
      job.lastError = err.message;
      job.updatedAt = new Date().toISOString();

      if (this.prisma?.isConnected) {
        try {
          await this.prisma.integrationJob.update({
            where: { id: jobId },
            data: {
              attempts: job.attempts,
              status: job.status,
              lastError: job.lastError,
            },
          });
        } catch {
          // Fallback
        }
      }

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
