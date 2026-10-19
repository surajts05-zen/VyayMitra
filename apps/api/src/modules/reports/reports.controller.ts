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
  CreateReportSchema,
  CreateReportInput,
  ReportFilterQuerySchema,
  ReportFilterQuery,
  ApprovalDecisionSchema,
  ApprovalDecisionInput,
  AuthTokenPayload,
} from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { ReportsService } from './reports.service.js';

@ApiTags('Expense Reports & Approvals (M3)')
@Controller('api/v1/reports')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Assemble draft expenses into a new expense report' })
  @ApiResponse({ status: 201, description: 'Expense report created in DRAFT status' })
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: CreateReportInput
  ) {
    const validated = CreateReportSchema.parse(body);
    return this.reportsService.create(tenantId, user, validated);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit expense report for multi-stage approval routing and policy checks' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report submitted and approval flow instantiated' })
  async submit(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') reportId: string
  ) {
    return this.reportsService.submit(tenantId, reportId, user);
  }

  @Post('steps/:stepId/decide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decide on an approval step with self-approval prevention' })
  @ApiParam({ name: 'stepId', description: 'Approval Step ID' })
  @ApiResponse({ status: 200, description: 'Decision recorded in immutable audit log' })
  async decideStep(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('stepId') stepId: string,
    @Body() body: ApprovalDecisionInput
  ) {
    const validated = ApprovalDecisionSchema.parse(body);
    return this.reportsService.decideApprovalStep(tenantId, stepId, user, validated);
  }

  @Get()
  @ApiOperation({ summary: 'List expense reports with role-based scoping' })
  @ApiResponse({ status: 200, description: 'List of expense reports' })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Query() query: ReportFilterQuery
  ) {
    const validated = ReportFilterQuerySchema.parse(query);
    return this.reportsService.findAll(tenantId, user, validated);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full details of a report including expenses, approval steps, and audit log' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Full report details' })
  async findOne(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Param('id') reportId: string
  ) {
    return this.reportsService.findById(tenantId, reportId, user);
  }
}
