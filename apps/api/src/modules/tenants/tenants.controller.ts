import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  UpdateTenantSchema,
  UpdateTenantInput,
  Role,
} from '@vyay/contracts';
import { TenantsService } from './tenants.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';

@ApiTags('Tenants & Organization')
@Controller('api/v1/tenants')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant organization profile' })
  @ApiResponse({ status: 200, description: 'Current tenant details' })
  async getCurrentTenant(@TenantId() tenantId: string) {
    return this.tenantsService.getTenant(tenantId);
  }

  @Patch('current')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update tenant organization branding and fiscal calendar' })
  @ApiResponse({ status: 200, description: 'Tenant settings updated' })
  async updateCurrentTenant(
    @TenantId() tenantId: string,
    @Body() body: UpdateTenantInput
  ) {
    const validated = UpdateTenantSchema.parse(body);
    return this.tenantsService.updateTenant(tenantId, validated);
  }

  @Get('current/members')
  @ApiOperation({ summary: 'List team members and roles in current organization' })
  @ApiResponse({ status: 200, description: 'Members of tenant' })
  async getMembers(@TenantId() tenantId: string) {
    return this.tenantsService.listMemberships(tenantId);
  }
}
