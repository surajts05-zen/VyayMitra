import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
  CreateWebhookSubscriptionSchema,
  CreateWebhookSubscriptionInput,
  CreateApiCredentialSchema,
  CreateApiCredentialInput,
  WebhookEvent,
  Role,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { WebhooksService } from './webhooks.service.js';
import { ApiCredentialsService } from './api-credentials.service.js';

@ApiTags('Developer Platform — API Keys & Webhooks (M6)')
@Controller('api/v1/developer')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.FINANCE_ADMIN)
@ApiBearerAuth('JWT-auth')
export class DeveloperController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly apiCredentialsService: ApiCredentialsService,
  ) {}

  // ─── API Credentials ────────────────────────────────────────────────────────

  @Post('api-credentials')
  @ApiOperation({
    summary: 'Create machine-to-machine API credentials (client_id + client_secret)',
    description: 'client_secret is shown only once at creation. Store it securely.'
  })
  @ApiResponse({ status: 201, description: 'API credential created with one-time visible secret' })
  createApiCredential(
    @TenantId() tenantId: string,
    @Body() body: CreateApiCredentialInput,
  ) {
    const validated = CreateApiCredentialSchema.parse(body);
    return this.apiCredentialsService.createCredential(tenantId, validated);
  }

  @Get('api-credentials')
  @ApiOperation({ summary: 'List API credentials for current tenant (secrets not returned)' })
  listApiCredentials(@TenantId() tenantId: string) {
    return this.apiCredentialsService.listCredentials(tenantId);
  }

  @Delete('api-credentials/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke and delete an API credential immediately' })
  @ApiParam({ name: 'id', description: 'API Credential ID' })
  revokeApiCredential(
    @TenantId() tenantId: string,
    @Param('id') credentialId: string,
  ) {
    this.apiCredentialsService.revokeCredential(tenantId, credentialId);
  }

  // ─── Webhooks ────────────────────────────────────────────────────────────────

  @Post('webhooks')
  @ApiOperation({
    summary: 'Create webhook endpoint subscription',
    description: 'Payloads are signed with HMAC-SHA256. Verify X-VyayMitra-Signature header.'
  })
  createWebhook(
    @TenantId() tenantId: string,
    @Body() body: CreateWebhookSubscriptionInput,
  ) {
    const validated = CreateWebhookSubscriptionSchema.parse(body);
    return this.webhooksService.createSubscription(tenantId, validated);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List all webhook subscriptions for current tenant' })
  listWebhooks(@TenantId() tenantId: string) {
    return this.webhooksService.listSubscriptions(tenantId);
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Get webhook subscription details' })
  @ApiParam({ name: 'id', description: 'Webhook Subscription ID' })
  getWebhook(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.getSubscription(tenantId, id);
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Update webhook subscription events or active status' })
  @ApiParam({ name: 'id', description: 'Webhook Subscription ID' })
  updateWebhook(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<CreateWebhookSubscriptionInput>,
  ) {
    return this.webhooksService.updateSubscription(tenantId, id, body);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete and unsubscribe a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Webhook Subscription ID' })
  deleteWebhook(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    this.webhooksService.deleteSubscription(tenantId, id);
  }

  @Post('webhooks/:id/rotate-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate HMAC signing key for a webhook subscription' })
  @ApiParam({ name: 'id', description: 'Webhook Subscription ID' })
  rotateWebhookKey(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.rotateSigningKey(tenantId, id);
  }

  @Get('webhooks/:id/deliveries')
  @ApiOperation({ summary: 'Get delivery log history for a webhook subscription' })
  @ApiParam({ name: 'id', description: 'Webhook Subscription ID' })
  getDeliveryLogs(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.webhooksService.getDeliveryLogs(tenantId, id);
  }

  @Get('webhooks/deliveries/all')
  @ApiOperation({ summary: 'Get all webhook delivery logs for current tenant' })
  getAllDeliveryLogs(@TenantId() tenantId: string) {
    return this.webhooksService.getDeliveryLogs(tenantId);
  }

  @Post('webhooks/test-dispatch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch a test event to all matching active webhook subscriptions' })
  async testDispatch(
    @TenantId() tenantId: string,
    @Body() body: { event: WebhookEvent; data?: Record<string, unknown> },
  ) {
    await this.webhooksService.dispatchEvent(tenantId, body.event, body.data ?? {});
    return { dispatched: true, event: body.event };
  }
}
