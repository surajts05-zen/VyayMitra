import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
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
  CreateTenantAdminSchema,
  CreateTenantAdminInput,
  UpdateTenantStatusSchema,
  UpdateTenantStatusInput,
  PlatformResetPasswordSchema,
  PlatformResetPasswordInput,
  AuthTokenPayload,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PlatformService } from './platform.service.js';

@ApiTags('Platform Administration')
@Controller('api/v1/platform')
@UseGuards(AuthGuard, PlatformAdminGuard)
@ApiBearerAuth('JWT-auth')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide platform statistics and health' })
  @ApiResponse({ status: 200, description: 'Platform stats' })
  getStats() {
    return this.platformService.getStats();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all corporate tenants in the platform' })
  @ApiResponse({ status: 200, description: 'List of tenant summaries' })
  listTenants() {
    return this.platformService.listTenants();
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Provision a new corporate tenant with initial owner credentials' })
  @ApiResponse({ status: 201, description: 'Tenant provisioned successfully' })
  createTenant(
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateTenantAdminInput
  ) {
    const validated = CreateTenantAdminSchema.parse(body);
    return this.platformService.createTenant(validated, user.email);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get detailed configuration for a specific tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant profile' })
  getTenant(@Param('id') tenantId: string) {
    return this.platformService.getTenant(tenantId);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant status (ACTIVE/SUSPENDED) or subscription plan' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant status updated' })
  updateTenant(
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') tenantId: string,
    @Body() body: UpdateTenantStatusInput
  ) {
    const validated = UpdateTenantStatusSchema.parse(body);
    return this.platformService.updateTenant(tenantId, validated, user.email);
  }

  @Get('tenants/:id/users')
  @ApiOperation({ summary: 'List all employees/users registered in a specific tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'List of tenant users' })
  listTenantUsers(@Param('id') tenantId: string) {
    return this.platformService.listTenantUsers(tenantId);
  }

  @Post('tenants/:tenantId/users/:userId/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Administratively reset a tenant user password with audited reason and session revocation',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Password reset and sessions invalidated' })
  resetUserPassword(
    @CurrentUser() user: AuthTokenPayload,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: PlatformResetPasswordInput
  ) {
    const validated = PlatformResetPasswordSchema.parse(body);
    return this.platformService.resetUserPassword(tenantId, userId, validated, user.email);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs of all platform administrative actions' })
  @ApiResponse({ status: 200, description: 'List of audit records' })
  listAuditLogs() {
    return this.platformService.listAuditLogs();
  }
}
