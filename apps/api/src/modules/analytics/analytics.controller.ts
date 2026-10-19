import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyticsFiltersSchema, Role } from '@vyay/contracts';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Analytics & Reporting (M6)')
@Controller('api/v1/analytics')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@Roles(
  Role.COMPANY_OWNER,
  Role.COMPANY_ADMIN,
  Role.FINANCE_ADMIN,
  Role.FINANCE_OPERATOR,
  Role.AUDITOR,
  Role.MANAGER,
)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get comprehensive spend analytics summary for current tenant' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  getSummary(
    @TenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('currency') currency?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const filters = AnalyticsFiltersSchema.parse({ fromDate, toDate, currency, departmentId });
    return this.analyticsService.getSummary(tenantId, filters);
  }

  @Get('spend/category')
  @ApiOperation({ summary: 'Get spend breakdown by expense category' })
  getSpendByCategory(
    @TenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('currency') currency?: string,
  ) {
    const filters = AnalyticsFiltersSchema.parse({ fromDate, toDate, currency });
    return this.analyticsService.getSpendByCategory(tenantId, filters);
  }

  @Get('spend/department')
  @ApiOperation({ summary: 'Get spend breakdown by department' })
  getSpendByDepartment(
    @TenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('currency') currency?: string,
  ) {
    const filters = AnalyticsFiltersSchema.parse({ fromDate, toDate, currency });
    return this.analyticsService.getSpendByDepartment(tenantId, filters);
  }

  @Get('spend/trend')
  @ApiOperation({ summary: 'Get monthly spend trend series for current fiscal period' })
  getSpendTrend(
    @TenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('currency') currency?: string,
  ) {
    const filters = AnalyticsFiltersSchema.parse({ fromDate, toDate, currency });
    return this.analyticsService.getSpendTrend(tenantId, filters);
  }

  @Get('export/csv')
  @Get('export/monthly-trend.csv')
  @ApiOperation({ summary: 'Export monthly spend trend as CSV (for payroll/finance teams)' })
  @ApiResponse({ status: 200, description: 'CSV file download', content: { 'text/csv': {} } })
  exportMonthlyCsv(
    @TenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Res() res?: Response,
  ) {
    const filters = AnalyticsFiltersSchema.parse({ fromDate, toDate });
    const csv = this.analyticsService.exportCsv(tenantId, filters);
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', 'attachment; filename="vyaymitra-monthly-trend.csv"');
    res!.send(csv);
  }

  @Get('export/categories.csv')
  @ApiOperation({ summary: 'Export category spend breakdown as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download', content: { 'text/csv': {} } })
  exportCategoriesCsv(
    @TenantId() tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Res() res?: Response,
  ) {
    const filters = AnalyticsFiltersSchema.parse({ fromDate, toDate });
    const csv = this.analyticsService.exportExpensesCsv(tenantId, filters);
    res!.setHeader('Content-Type', 'text/csv');
    res!.setHeader('Content-Disposition', 'attachment; filename="vyaymitra-category-spend.csv"');
    res!.send(csv);
  }
}
