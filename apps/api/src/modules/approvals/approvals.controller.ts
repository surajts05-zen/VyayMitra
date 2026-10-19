import {
  Controller,
  Get,
  Post,
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
  ApprovalDecisionSchema,
  ApprovalDecisionInput,
  CreateDelegationSchema,
  CreateDelegationInput,
  AuthTokenPayload,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { ApprovalsService } from './approvals.service.js';

@ApiTags('Approvals & Delegations (M3)')
@Controller('api/v1/approvals')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Get list of pending approval steps assigned to current user or delegated' })
  @ApiResponse({ status: 200, description: 'List of pending approval steps' })
  async getInbox(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload
  ) {
    return this.approvalsService.getPendingInbox(tenantId, user);
  }

  @Post(':stepId/decide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit approval decision (APPROVED, REJECTED, CHANGES_REQUESTED, DELEGATED)' })
  @ApiParam({ name: 'stepId', description: 'Approval Step ID' })
  @ApiResponse({ status: 200, description: 'Approval decision recorded in immutable audit log' })
  async decide(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('stepId') stepId: string,
    @Body() body: ApprovalDecisionInput
  ) {
    const validated = ApprovalDecisionSchema.parse(body);
    const step = await this.approvalsService.getStepById(tenantId, stepId);
    return this.approvalsService.decide(
      tenantId,
      stepId,
      user,
      { id: step.reportId, submittedByUserId: (step as any).submittedByUserId || '' },
      validated
    );
  }

  @Post('delegations')
  @ApiOperation({ summary: 'Create an out-of-office approval delegation' })
  @ApiResponse({ status: 201, description: 'Delegation created with timeframe bounds' })
  async createDelegation(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateDelegationInput
  ) {
    const validated = CreateDelegationSchema.parse(body);
    return this.approvalsService.createDelegation(tenantId, user, validated);
  }

  @Get('delegations')
  @ApiOperation({ summary: 'List active delegations for current user or tenant' })
  @ApiResponse({ status: 200, description: 'List of active delegations' })
  async listDelegations(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload
  ) {
    return this.approvalsService.listDelegations(tenantId, user.userId);
  }
}
