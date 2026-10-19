import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { OrgModule } from './modules/org/org.module.js';
import { ExpensesModule } from './modules/expenses/expenses.module.js';
import { ApprovalsModule } from './modules/approvals/approvals.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { IntegrationsModule } from './modules/integrations/integrations.module.js';
import { AnalyticsModule } from './modules/analytics/analytics.module.js';
import { DeveloperModule } from './modules/developer/developer.module.js';
import { ObservabilityModule } from './modules/observability/observability.module.js';
import { RetentionModule } from './modules/retention/retention.module.js';
import { PlatformModule } from './modules/platform/platform.module.js';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    EmployeesModule,
    OrgModule,
    ExpensesModule,
    ApprovalsModule,
    ReportsModule,
    FinanceModule,
    IntegrationsModule,
    AnalyticsModule,
    DeveloperModule,
    ObservabilityModule,
    RetentionModule,
    PlatformModule,
  ],
})
export class AppModule {}
