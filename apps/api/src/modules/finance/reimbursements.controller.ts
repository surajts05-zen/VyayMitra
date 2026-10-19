import {
  Controller,
  Get,
  Post,
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
  RecordPaymentSchema,
  RecordPaymentInput,
  ReimbursementFilterQuerySchema,
  ReimbursementFilterQuery,
  AuthTokenPayload,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { ReimbursementsService } from './reimbursements.service.js';

@ApiTags('Reimbursements & Partial Payments (M4)')
@Controller('api/v1/reimbursements')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReimbursementsController {
  constructor(private readonly reimbursementsService: ReimbursementsService) {}

  @Get()
  @ApiOperation({ summary: 'List reimbursements with status, employee scoping, and pagination' })
  @ApiResponse({ status: 200, description: 'List of reimbursements' })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ReimbursementFilterQuery
  ) {
    const validated = ReimbursementFilterQuerySchema.parse(query);
    return this.reimbursementsService.findAll(tenantId, user, validated);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reimbursement record by ID with payment history and remaining balance' })
  @ApiParam({ name: 'id', description: 'Reimbursement ID' })
  @ApiResponse({ status: 200, description: 'Reimbursement record details' })
  async findOne(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') id: string
  ) {
    return this.reimbursementsService.findById(tenantId, id, user);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disburse a full or partial reimbursement payment installment' })
  @ApiParam({ name: 'id', description: 'Reimbursement ID' })
  @ApiResponse({ status: 200, description: 'Payment recorded and balance updated' })
  async recordPayment(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') reimbursementId: string,
    @Body() body: RecordPaymentInput
  ) {
    const validated = RecordPaymentSchema.parse(body);
    return this.reimbursementsService.recordPayment(tenantId, reimbursementId, user, validated);
  }
}
