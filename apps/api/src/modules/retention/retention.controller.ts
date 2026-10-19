import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthTokenPayload, Role } from '@vyay/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RetentionService } from './retention.service.js';

@ApiTags('Settings - Data Retention (M7)')
@Controller('api/v1/settings/retention')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.FINANCE_ADMIN)
@ApiBearerAuth('JWT-auth')
export class RetentionController {
  constructor(private readonly retention: RetentionService) {}

  @Get()
  @ApiOperation({ summary: 'Get the effective tenant retention policy and immutable exclusions' })
  getPolicy() {
    return this.retention.getPolicy();
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview tenant-scoped retention candidates without deleting data' })
  @ApiResponse({ status: 201, description: 'Preview generated with a short-lived execution token' })
  preview(@TenantId() tenantId: string) {
    return this.retention.preview(tenantId);
  }

  @Post('execute')
  @Roles(Role.COMPANY_OWNER, Role.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Redact eligible reviewed OCR provider payloads after an explicit preview' })
  execute(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: { confirmation?: string; previewToken?: string },
  ) {
    return this.retention.execute(tenantId, user.userId, body);
  }
}

