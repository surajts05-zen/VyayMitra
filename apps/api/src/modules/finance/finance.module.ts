import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EmployeesModule } from '../employees/employees.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { FinanceService } from './finance.service.js';
import { FinanceController } from './finance.controller.js';
import { ReimbursementsService } from './reimbursements.service.js';
import { ReimbursementsController } from './reimbursements.controller.js';

@Module({
  imports: [AuthModule, EmployeesModule, ReportsModule],
  controllers: [FinanceController, ReimbursementsController],
  providers: [FinanceService, ReimbursementsService],
  exports: [FinanceService, ReimbursementsService],
})
export class FinanceModule {}
