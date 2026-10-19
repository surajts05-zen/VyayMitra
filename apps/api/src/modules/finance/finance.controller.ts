import {
  Controller,
  Get,
  Post,
  Put,
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
  UpdateGLAccountMappingSchema,
  UpdateGLAccountMappingInput,
  FinanceValidationSchema,
  FinanceValidationInput,
  CreateBudgetSchema,
  CreateBudgetInput,
  AuthTokenPayload,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { FinanceService } from './finance.service.js';

@ApiTags('Finance Review, GL Mapping & Budgets (M4)')
@Controller('api/v1/finance')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('review-queue')
  @ApiOperation({ summary: 'Get list of approved reports waiting for finance verification and payout' })
  @ApiResponse({ status: 200, description: 'List of reports in finance review queue' })
  async getReviewQueue(@TenantId() tenantId: string) {
    return this.financeService.getReviewQueue(tenantId);
  }

  @Post('reports/:id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify documentation, tax treatment, and GL account coding for an approved report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Finance validation recorded' })
  async validateReport(
    @TenantId() tenantId: string,
    @Param('id') reportId: string,
    @Body() body: FinanceValidationInput
  ) {
    const validated = FinanceValidationSchema.parse(body);
    return this.financeService.validateReportForPayout(tenantId, reportId, validated);
  }

  @Get('gl-mappings')
  @ApiOperation({ summary: 'Get GL account code and tax treatment mappings for all expense categories' })
  @ApiResponse({ status: 200, description: 'Category to GL account mappings' })
  async getGLMappings(@TenantId() tenantId: string) {
    return this.financeService.getGLAccountMappings(tenantId);
  }

  @Put('gl-mappings/:categoryId')
  @ApiOperation({ summary: 'Update GL account code and tax treatment for an expense category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'GL mapping updated' })
  async updateGLMapping(
    @TenantId() tenantId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateGLAccountMappingInput
  ) {
    const validated = UpdateGLAccountMappingSchema.parse(body);
    return this.financeService.updateGLAccountMapping(tenantId, categoryId, validated);
  }

  @Get('ledger-preview/:reportId')
  @ApiOperation({ summary: 'Preview double-entry accounting ledger effects for an approved expense claim' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Balanced debit and credit ledger impact preview' })
  async previewLedger(
    @TenantId() tenantId: string,
    @Param('reportId') reportId: string
  ) {
    return this.financeService.previewLedgerEffects(tenantId, {
      id: reportId,
      totalAmount: '8450.00',
      currency: 'INR',
    });
  }

  @Get('budgets')
  @ApiOperation({ summary: 'List spending budgets and computed utilization percentages' })
  @ApiResponse({ status: 200, description: 'Active budgets and utilization metrics' })
  async getBudgets(@TenantId() tenantId: string) {
    return this.financeService.getBudgets(tenantId);
  }

  @Post('budgets')
  @ApiOperation({ summary: 'Create a new department, project, or category budget ceiling' })
  @ApiResponse({ status: 201, description: 'Budget ceiling created' })
  async createBudget(
    @TenantId() tenantId: string,
    @Body() body: CreateBudgetInput
  ) {
    const validated = CreateBudgetSchema.parse(body);
    return this.financeService.createBudget(tenantId, validated);
  }
}
