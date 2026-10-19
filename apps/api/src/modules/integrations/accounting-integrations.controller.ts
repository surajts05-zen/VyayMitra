import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  UpdateMappingBatchSchema,
  UpdateMappingBatchInput,
  ExportReportRequestSchema,
  ExportReportRequest,
  TallyXmlExportRequestSchema,
  TallyXmlExportRequest,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { IntegrationsService } from './integrations.service.js';

@ApiTags('Accounting Integrations (Zoho Books, Xero, Tally Prime)')
@Controller('api/v1/integrations')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AccountingIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List all supported accounting integrations (Zoho Books, Xero, Tally Prime)' })
  @ApiResponse({ status: 200, description: 'List of supported accounting ERP connectors' })
  getSupportedProviders() {
    return this.integrationsService.listSupportedProviders();
  }

  @Get(':provider/health')
  @ApiOperation({ summary: 'Check connection health for a specific accounting provider' })
  @ApiParam({ name: 'provider', enum: ['zoho_books', 'xero', 'tally_prime'] })
  @ApiResponse({ status: 200, description: 'Connection status and health info' })
  async getHealth(
    @TenantId() tenantId: string,
    @Param('provider') provider: string
  ) {
    return this.integrationsService.getHealth(tenantId, provider);
  }

  @Get(':provider/reference-data')
  @ApiOperation({ summary: 'Fetch Chart of Accounts, tax codes, vendors, and cost centers for provider' })
  @ApiParam({ name: 'provider', enum: ['zoho_books', 'xero', 'tally_prime'] })
  async getReferenceData(
    @TenantId() tenantId: string,
    @Param('provider') provider: string
  ) {
    return this.integrationsService.getReferenceData(tenantId, provider);
  }

  @Get(':provider/mappings')
  @ApiOperation({ summary: 'Get category-to-GL account and tax mappings for specific provider' })
  @ApiParam({ name: 'provider', enum: ['zoho_books', 'xero', 'tally_prime'] })
  async getMappings(
    @TenantId() tenantId: string,
    @Param('provider') provider: string
  ) {
    return this.integrationsService.getMappings(tenantId, provider);
  }

  @Put(':provider/mappings')
  @ApiOperation({ summary: 'Update category and tax mappings for a specific provider' })
  @ApiParam({ name: 'provider', enum: ['zoho_books', 'xero', 'tally_prime'] })
  async updateMappings(
    @TenantId() tenantId: string,
    @Param('provider') provider: string,
    @Body() body: UpdateMappingBatchInput
  ) {
    const validated = UpdateMappingBatchSchema.parse(body);
    return this.integrationsService.updateMappings(tenantId, validated, provider);
  }

  @Post(':provider/dry-run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dry-run posting preview for an approved report against provider ledgers' })
  @ApiParam({ name: 'provider', enum: ['zoho_books', 'xero', 'tally_prime'] })
  async dryRun(
    @TenantId() tenantId: string,
    @Param('provider') provider: string,
    @Body() body: { reportId: string }
  ) {
    return this.integrationsService.validateAndDryRun(tenantId, body.reportId, provider);
  }

  @Post(':provider/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export approved report to Zoho Books, Xero, or Tally Prime' })
  @ApiParam({ name: 'provider', enum: ['zoho_books', 'xero', 'tally_prime'] })
  async exportReport(
    @TenantId() tenantId: string,
    @Param('provider') provider: string,
    @Body() body: ExportReportRequest
  ) {
    const validated = ExportReportRequestSchema.parse(body);
    return this.integrationsService.exportReport(
      tenantId,
      validated.reportId,
      validated.exportMode,
      validated.dryRun,
      provider
    );
  }

  @Post('tally/xml-voucher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate and optionally direct-sync a Tally Prime XML Voucher' })
  async exportTallyXml(
    @TenantId() tenantId: string,
    @Body() body: TallyXmlExportRequest
  ) {
    const validated = TallyXmlExportRequestSchema.parse(body);
    return this.integrationsService.exportTallyXml(tenantId, validated);
  }

  @Get('xero/auth-url')
  @ApiOperation({ summary: 'Generate Xero OAuth 2.0 authorization URL' })
  async getXeroAuthUrl(
    @TenantId() tenantId: string,
    @Query('redirectUri') redirectUri?: string
  ) {
    return this.integrationsService.buildXeroAuthUrl(tenantId, redirectUri);
  }
}
