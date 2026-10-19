import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller.js';
import { ApprovalsService } from './approvals.service.js';
import { PolicyService } from './policy.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { EmployeesModule } from '../employees/employees.module.js';

@Module({
  imports: [AuthModule, EmployeesModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, PolicyService],
  exports: [ApprovalsService, PolicyService],
})
export class ApprovalsModule {}
