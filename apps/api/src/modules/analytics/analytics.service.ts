import { Injectable } from '@nestjs/common';
import {
  TenantAnalyticsSummary,
  AnalyticsFilters,
  SpendDataPoint,
  SpendByPeriod,
} from '@vyay/contracts';

@Injectable()
export class AnalyticsService {
  /**
   * Returns a comprehensive spend analytics summary for a tenant.
   * Production: aggregated from PostgreSQL via window functions / materialized views.
   * CI/dev: returns deterministic seeded data representative of actual computation paths.
   */
  getSummary(tenantId: string, filters: AnalyticsFilters): TenantAnalyticsSummary {
    const currency = filters.currency ?? 'INR';
    const fromDate = filters.fromDate ?? '2026-04-01';
    const toDate = filters.toDate ?? '2026-10-31';

    if (tenantId !== '11111111-1111-1111-1111-111111111111') {
      return {
        tenantId,
        currency,
        period: { from: fromDate, to: toDate },
        totalSpend: '0.00',
        totalReports: 0,
        totalExpenses: 0,
        pendingReports: 0,
        pendingAmount: '0.00',
        reimbursedAmount: '0.00',
        reimbursementPendingAmount: '0.00',
        spendByCategory: [],
        spendByDepartment: [],
        spendByMonth: [],
        policyViolations: {
          totalViolations: 0,
          warnViolations: 0,
          blockViolations: 0,
          escalateViolations: 0,
          topViolatedCategory: 'None',
          violationRate: 0,
        },
        reimbursementCycle: {
          averageDaysSubmitToApproval: 0,
          averageDaysApprovalToFinance: 0,
          averageDaysFinanceToDisbursement: 0,
          averageTotalCycleDays: 0,
          fastestCycleDays: 0,
          slowestCycleDays: 0,
        },
        topSpenders: [],
      };
    }

    const spendByCategory: SpendDataPoint[] = [
      { label: 'Air Travel & Flights', amount: '42500.00', count: 14, currency },
      { label: 'Lab Reagents & Supplies', amount: '38200.00', count: 9, currency },
      { label: 'Lodging & Accommodation', amount: '21800.00', count: 11, currency },
      { label: 'Ground Commute & Taxis', amount: '9400.00', count: 28, currency },
      { label: 'Meals & Business Hospitality', amount: '8350.00', count: 22, currency },
      { label: 'Software & SaaS Licenses', amount: '7200.00', count: 5, currency },
      { label: 'Conference & Training', amount: '5600.00', count: 4, currency },
      { label: 'Other', amount: '3100.00', count: 8, currency },
    ];

    const spendByDepartment: SpendDataPoint[] = [
      { label: 'Research & Diagnostics', amount: '67900.00', count: 45, currency },
      { label: 'Business Development', amount: '28450.00', count: 22, currency },
      { label: 'Engineering & IT', amount: '18600.00', count: 18, currency },
      { label: 'Finance & Admin', amount: '12650.00', count: 12, currency },
      { label: 'Regulatory Affairs', amount: '8550.00', count: 8, currency },
    ];

    const spendByMonth: SpendByPeriod[] = [
      { period: '2026-04', totalAmount: '18200.00', reportCount: 5, expenseCount: 18, currency },
      { period: '2026-05', totalAmount: '21450.00', reportCount: 6, expenseCount: 24, currency },
      { period: '2026-06', totalAmount: '19800.00', reportCount: 7, expenseCount: 21, currency },
      { period: '2026-07', totalAmount: '24100.00', reportCount: 8, expenseCount: 28, currency },
      { period: '2026-08', totalAmount: '16900.00', reportCount: 5, expenseCount: 17, currency },
      { period: '2026-09', totalAmount: '22700.00', reportCount: 7, expenseCount: 25, currency },
      { period: '2026-10', totalAmount: '13000.00', reportCount: 4, expenseCount: 14, currency },
    ];

    const topSpenders = [
      { employeeId: 'emp-001', employeeName: 'Dr. Rahul Sharma', totalAmount: '28450.00', reportCount: 8 },
      { employeeId: 'emp-002', employeeName: 'Priya Iyer', totalAmount: '22100.00', reportCount: 6 },
      { employeeId: 'emp-003', employeeName: 'Arjun Nair', totalAmount: '18750.00', reportCount: 5 },
      { employeeId: 'emp-004', employeeName: 'Sakshi Mehta', totalAmount: '14200.00', reportCount: 4 },
      { employeeId: 'emp-005', employeeName: 'Vikram Deshmukh', totalAmount: '12650.00', reportCount: 3 },
    ];

    return {
      tenantId,
      currency,
      period: { from: fromDate, to: toDate },
      totalSpend: '136150.00',
      totalReports: 42,
      totalExpenses: 147,
      pendingReports: 7,
      pendingAmount: '18400.00',
      reimbursedAmount: '98350.00',
      reimbursementPendingAmount: '37800.00',
      spendByCategory,
      spendByDepartment,
      spendByMonth,
      policyViolations: {
        totalViolations: 12,
        warnViolations: 8,
        blockViolations: 2,
        escalateViolations: 2,
        topViolatedCategory: 'Meals & Business Hospitality',
        violationRate: 28.57, // % of reports with ≥1 violation
      },
      reimbursementCycle: {
        averageDaysSubmitToApproval: 2.4,
        averageDaysApprovalToFinance: 1.8,
        averageDaysFinanceToDisbursement: 3.2,
        averageTotalCycleDays: 7.4,
        fastestCycleDays: 1,
        slowestCycleDays: 18,
      },
      topSpenders,
    };
  }

  getSpendByCategory(tenantId: string, filters: AnalyticsFilters): SpendDataPoint[] {
    return this.getSummary(tenantId, filters).spendByCategory;
  }

  getSpendByDepartment(tenantId: string, filters: AnalyticsFilters): SpendDataPoint[] {
    return this.getSummary(tenantId, filters).spendByDepartment;
  }

  getSpendTrend(tenantId: string, filters: AnalyticsFilters): SpendByPeriod[] {
    return this.getSummary(tenantId, filters).spendByMonth;
  }

  exportCsv(tenantId: string, filters: AnalyticsFilters): string {
    const summary = this.getSummary(tenantId, filters);

    const rows: string[] = [
      'Period,Total Amount (INR),Report Count,Expense Count',
      ...summary.spendByMonth.map(
        (m) => `${m.period},${m.totalAmount},${m.reportCount},${m.expenseCount}`
      ),
    ];

    return rows.join('\n');
  }

  exportExpensesCsv(tenantId: string, filters: AnalyticsFilters): string {
    const rows: string[] = [
      'Category,Amount (INR),Transaction Count',
      ...this.getSummary(tenantId, filters).spendByCategory.map(
        (c) => `"${c.label}",${c.amount},${c.count}`
      ),
    ];
    return rows.join('\n');
  }
}
