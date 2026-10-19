import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { ApprovalsModule } from '../approvals/approvals.module.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule, ExpensesModule, ApprovalsModule, EmployeesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
