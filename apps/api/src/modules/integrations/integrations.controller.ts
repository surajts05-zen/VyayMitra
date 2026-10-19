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
  ApiQuery,
} from '@nestjs/swagger';
import {
  UpdateMappingBatchSchema,
  UpdateMappingBatchInput,
  ExportReportRequestSchema,
  ExportReportRequest,
  ZohoRegion,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { IntegrationsService } from './integrations.service.js';

@ApiTags('Integrations & Zoho Books (M5)')
@Controller('api/v1/integrations/zoho')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Zoho Books connection health for current tenant' })
  @ApiResponse({ status: 200, description: 'Connection status and health info' })
  async getHealth(@TenantId() tenantId: string) {
    return this.integrationsService.getHealth(tenantId);
  }

  @Get('auth-url')
  @ApiOperation({ summary: 'Generate regional Zoho Books OAuth authorization URL' })
  @ApiQuery({ name: 'region', enum: ZohoRegion, required: false })
  @ApiQuery({ name: 'redirectUri', type: String, required: false })
  async getAuthUrl(
    @TenantId() tenantId: string,
    @Query('region') region?: ZohoRegion,
    @Query('redirectUri') redirectUri?: string
  ) {
    return this.integrationsService.buildAuthUrl(tenantId, region, redirectUri);
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Zoho OAuth authorization code for tokens' })
  async handleCallback(
    @TenantId() tenantId: string,
    @Body() body: { code: string; state: string; region?: ZohoRegion }
  ) {
    return this.integrationsService.handleOAuthCallback(
      tenantId,
      body.code,
      body.state,
      body.region
    );
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect and revoke Zoho Books OAuth tokens' })
  async disconnect(@TenantId() tenantId: string) {
    return this.integrationsService.disconnect(tenantId);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List Zoho Books organizations available to the connected account' })
  async listOrganizations(@TenantId() tenantId: string) {
    return this.integrationsService.listOrganizations(tenantId);
  }

  @Post('select-org')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Select active Zoho Books organization' })
  async selectOrganization(
    @TenantId() tenantId: string,
    @Body() body: { orgId: string; orgName?: string }
  ) {
    return this.integrationsService.selectOrganization(tenantId, body.orgId, body.orgName);
  }

  @Get('reference-data')
  @ApiOperation({ summary: 'Get Chart of Accounts, GST tax codes, vendors, and projects from Zoho Books' })
  async getReferenceData(@TenantId() tenantId: string) {
    return this.integrationsService.getReferenceData(tenantId);
  }

  @Get('mappings')
  @ApiOperation({ summary: 'Get external category and account mappings' })
  async getMappings(@TenantId() tenantId: string) {
    return this.integrationsService.getMappings(tenantId);
  }

  @Put('mappings')
  @ApiOperation({ summary: 'Update category-to-GL account and tax mappings' })
  async updateMappings(
    @TenantId() tenantId: string,
    @Body() body: UpdateMappingBatchInput
  ) {
    const validated = UpdateMappingBatchSchema.parse(body);
    return this.integrationsService.updateMappings(tenantId, validated);
  }

  @Post('dry-run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform dry-run ledger posting preview for an approved report' })
  async dryRun(
    @TenantId() tenantId: string,
    @Body() body: { reportId: string }
  ) {
    return this.integrationsService.validateAndDryRun(tenantId, body.reportId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export approved expense report to Zoho Books as a bill/expense' })
  async exportReport(
    @TenantId() tenantId: string,
    @Body() body: ExportReportRequest
  ) {
    const validated = ExportReportRequestSchema.parse(body);
    return this.integrationsService.exportReport(
      tenantId,
      validated.reportId,
      validated.exportMode,
      validated.dryRun
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get history of integration sync jobs for the current tenant' })
  async getJobs(@TenantId() tenantId: string) {
    return this.integrationsService.getJobs(tenantId);
  }

  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed integration export job' })
  async retryJob(
    @TenantId() tenantId: string,
    @Param('id') jobId: string
  ) {
    return this.integrationsService.retryJob(tenantId, jobId);
  }
}
