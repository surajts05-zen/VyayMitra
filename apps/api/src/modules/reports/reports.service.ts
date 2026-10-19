import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Decimal } from 'decimal.js';
import {
  CreateReportInput,
  ReportDto,
  ReportFilterQuery,
  ReportStatus,
  ReimbursementStatus,
  ApprovalDecisionInput,
  ApprovalDecision,
  Role,
} from '@vyay/contracts';
import { ExpensesService } from '../expenses/expenses.service.js';
import { ApprovalsService } from '../approvals/approvals.service.js';
import { PolicyService } from '../approvals/policy.service.js';
import { EmployeesService } from '../employees/employees.service.js';

interface InMemoryReport {
  id: string;
  tenantId: string;
  employeeId: string;
  submittedByUserId: string;
  submittedByName?: string;
  title: string;
  businessPurpose: string;
  status: ReportStatus;
  reimbursementStatus: ReimbursementStatus;
  totalAmount: string;
  reimbursableAmount: string;
  currency: string;
  expenseIds: string[];
  policyViolations: any[];
  submittedAt?: string | null;
  approvedAt?: string | null;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ReportsService {
  private reports = new Map<string, InMemoryReport>();

  constructor(
    private readonly expensesService: ExpensesService,
    private readonly approvalsService: ApprovalsService,
    private readonly policyService: PolicyService,
    private readonly employeesService: EmployeesService
  ) {
    this.seedBaselineReports();
    this.approvalsService.registerReportDecisionHandler(
      async (tenantId, reportId, decision, isFullyApproved) => {
        const report = this.reports.get(reportId);
        if (!report) return;

        if (decision === ApprovalDecision.APPROVED) {
          if (isFullyApproved) {
            report.status = ReportStatus.APPROVED;
            report.reimbursementStatus = ReimbursementStatus.ELIGIBLE;
            report.approvedAt = new Date().toISOString();
            await this.expensesService.lockForReport(tenantId, report.expenseIds);
          } else {
            report.status = ReportStatus.IN_REVIEW;
          }
        } else if (decision === ApprovalDecision.CHANGES_REQUESTED) {
          report.status = ReportStatus.CHANGES_REQUESTED;
          await this.expensesService.unlockFromReport(tenantId, report.expenseIds, ReportStatus.DRAFT as any);
        } else if (decision === ApprovalDecision.REJECTED) {
          report.status = ReportStatus.REJECTED;
          report.reimbursementStatus = ReimbursementStatus.CANCELLED;
          await this.expensesService.unlockFromReport(tenantId, report.expenseIds, 'REJECTED' as any);
        }
        report.updatedAt = new Date().toISOString();
      }
    );
  }

  private seedBaselineReports() {
    // Seed baseline report for testing
    const t1Id = '11111111-1111-1111-1111-111111111111';
    const rep1Id = 'rep-1111-1111-1111-111111111111';
    this.reports.set(rep1Id, {
      id: rep1Id,
      tenantId: t1Id,
      employeeId: 'emp-rahul-2222-2222-2222-222222222222',
      submittedByUserId: 'dddd4444-4444-4444-4444-444444444444',
      submittedByName: 'Dr. Rahul Sharma',
      title: 'October 2026 Bio-Tech Annual Summit Claims',
      businessPurpose: 'Conference attendance, lodging, and client discussions',
      status: ReportStatus.DRAFT,
      reimbursementStatus: ReimbursementStatus.NOT_READY,
      totalAmount: '4500.000000',
      reimbursableAmount: '4500.000000',
      currency: 'INR',
      expenseIds: ['exp-1111-1111-1111-111111111111'],
      policyViolations: [],
      createdAt: '2026-10-16T10:00:00.000Z',
      updatedAt: '2026-10-16T10:00:00.000Z',
    });

    const rep001Id = 'rep-001';
    this.reports.set(rep001Id, {
      id: rep001Id,
      tenantId: t1Id,
      employeeId: 'emp-rahul-2222-2222-2222-222222222222',
      submittedByUserId: 'dddd4444-4444-4444-4444-444444444444',
      submittedByName: 'Dr. Rahul Sharma',
      title: 'Bangalore Lab Equipment & Reagents',
      businessPurpose: 'Procurement of specialized spectrophotometer reagents and calibration standards',
      status: ReportStatus.APPROVED,
      reimbursementStatus: ReimbursementStatus.ELIGIBLE,
      totalAmount: '8450.00',
      reimbursableAmount: '8450.00',
      currency: 'INR',
      expenseIds: ['exp-1111-1111-1111-111111111111'],
      policyViolations: [],
      createdAt: '2026-10-18T10:30:00.000Z',
      approvedAt: '2026-10-18T14:20:00.000Z',
      updatedAt: '2026-10-18T14:20:00.000Z',
    });
  }

  async create(
    tenantId: string,
    currentUser: { userId: string; email: string },
    input: CreateReportInput
  ): Promise<ReportDto> {
    const employee = await this.employeesService.ensureEmployeeForUser(
      tenantId,
      currentUser.userId,
      currentUser.email
    );

    // Fetch and validate selected expenses
    const expenses = await this.expensesService.getByIds(tenantId, input.expenseIds);
    if (expenses.length !== input.expenseIds.length) {
      throw new BadRequestException('One or more selected expenses were not found or do not belong to this tenant');
    }

    // Verify all selected expenses belong to this employee and are in DRAFT status
    let total = new Decimal(0);
    let reimbursable = new Decimal(0);
    let currency = 'INR';

    for (const exp of expenses) {
      if (exp.employeeId !== employee.id) {
        throw new ForbiddenException(`Expense '${exp.merchant}' belongs to another employee`);
      }
      if (exp.reportId) {
        throw new BadRequestException(`Expense '${exp.merchant}' is already attached to another report`);
      }
      currency = exp.currency;
      const amt = new Decimal(exp.amount);
      total = total.plus(amt);
      if (exp.reimbursable) {
        reimbursable = reimbursable.plus(amt);
      }
    }

    const id = randomUUID();
    const report: InMemoryReport = {
      id,
      tenantId,
      employeeId: employee.id,
      submittedByUserId: currentUser.userId,
      submittedByName: employee.displayName,
      title: input.title,
      businessPurpose: input.businessPurpose,
      status: ReportStatus.DRAFT,
      reimbursementStatus: ReimbursementStatus.NOT_READY,
      totalAmount: total.toFixed(6),
      reimbursableAmount: reimbursable.toFixed(6),
      currency,
      expenseIds: input.expenseIds,
      policyViolations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reports.set(id, report);
    return this.mapToDto(report);
  }

  async submit(
    tenantId: string,
    reportId: string,
    currentUser: { userId: string }
  ): Promise<{ report: ReportDto; approvalFlow: any[]; policyViolations: any[] }> {
    const report = this.reports.get(reportId);
    if (!report || report.tenantId !== tenantId) {
      throw new NotFoundException(`Expense report with id ${reportId} not found`);
    }

    if (report.submittedByUserId !== currentUser.userId) {
      throw new ForbiddenException('You can only submit your own expense reports');
    }

    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.CHANGES_REQUESTED) {
      throw new BadRequestException(`Cannot submit report in status '${report.status}'. Must be DRAFT or CHANGES_REQUESTED.`);
    }

    const expenses = await this.expensesService.getByIds(tenantId, report.expenseIds);

    // 1. Run Policy Evaluation
    const policyResult = this.policyService.evaluateReport(tenantId, {
      id: report.id,
      totalAmount: report.totalAmount,
      currency: report.currency,
      expenses: expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        merchant: e.merchant,
        receiptIds: e.receiptIds,
        duplicateWarning: e.duplicateWarning,
      })),
    });

    if (!policyResult.passed) {
      throw new BadRequestException('Report submission blocked by critical company policy violations.');
    }

    // 2. Lock Expenses & Attach to Report
    await this.expensesService.attachToReport(tenantId, report.expenseIds, report.id);

    // 3. Instantiate Multi-Step Sequential Approval Flow
    const approvalSteps = await this.approvalsService.createApprovalFlow(
      tenantId,
      {
        id: report.id,
        employeeId: report.employeeId,
        submittedByUserId: report.submittedByUserId,
        totalAmount: report.totalAmount,
      },
      policyResult
    );

    // 4. Update Report State
    report.status = ReportStatus.SUBMITTED;
    report.reimbursementStatus = ReimbursementStatus.NOT_READY;
    report.submittedAt = new Date().toISOString();
    report.policyViolations = policyResult.violations;
    report.updatedAt = new Date().toISOString();

    return {
      report: this.mapToDto(report),
      approvalFlow: approvalSteps,
      policyViolations: policyResult.violations,
    };
  }

  async decideApprovalStep(
    tenantId: string,
    stepId: string,
    currentUser: { userId: string; email: string; role: Role },
    input: ApprovalDecisionInput
  ): Promise<{ step: any; report: ReportDto }> {
    const step = await this.approvalsService.getStepById(tenantId, stepId);
    const report = this.reports.get(step.reportId);
    if (!report || report.tenantId !== tenantId) {
      throw new NotFoundException('Expense report associated with this step not found');
    }

    // Call ApprovalsService with report submitter details for self-approval enforcement
    const result = await this.approvalsService.decide(
      tenantId,
      stepId,
      currentUser,
      { id: report.id, submittedByUserId: report.submittedByUserId },
      input
    );

    // Update Report State based on Decision
    if (input.decision === ApprovalDecision.APPROVED) {
      if (result.isFullyApproved) {
        report.status = ReportStatus.APPROVED;
        report.reimbursementStatus = ReimbursementStatus.ELIGIBLE; // Eligible for finance payment
        report.approvedAt = new Date().toISOString();
        await this.expensesService.lockForReport(tenantId, report.expenseIds);
      } else {
        report.status = ReportStatus.IN_REVIEW;
      }
    } else if (input.decision === ApprovalDecision.CHANGES_REQUESTED) {
      report.status = ReportStatus.CHANGES_REQUESTED;
      // Unlock expenses so employee can correct details
      await this.expensesService.unlockFromReport(tenantId, report.expenseIds, ReportStatus.DRAFT as any);
    } else if (input.decision === ApprovalDecision.REJECTED) {
      report.status = ReportStatus.REJECTED;
      report.reimbursementStatus = ReimbursementStatus.CANCELLED;
      // Mark expenses rejected
      await this.expensesService.unlockFromReport(tenantId, report.expenseIds, 'REJECTED' as any);
    }

    report.updatedAt = new Date().toISOString();
    return {
      step: result.step,
      report: this.mapToDto(report),
    };
  }

  async findAll(
    tenantId: string,
    currentUser: { userId: string; role: Role },
    query: ReportFilterQuery
  ): Promise<ReportDto[]> {
    const employee = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    const results: ReportDto[] = [];

    for (const rep of this.reports.values()) {
      if (rep.tenantId !== tenantId) continue;

      if (currentUser.role === Role.EMPLOYEE) {
        if (!employee || rep.employeeId !== employee.id) continue;
      }

      if (query.status && rep.status !== query.status) continue;
      if (query.employeeId && rep.employeeId !== query.employeeId) continue;

      results.push(this.mapToDto(rep));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results.slice(query.offset, query.offset + query.limit);
  }

  async findById(
    tenantId: string,
    reportId: string,
    currentUser: { userId: string; role: Role }
  ): Promise<ReportDto & { expenses: any[]; approvalSteps: any[]; auditLog: any[] }> {
    const report = this.reports.get(reportId);
    if (!report || report.tenantId !== tenantId) {
      throw new NotFoundException(`Expense report with id ${reportId} not found in this organization`);
    }

    const employee = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    if (currentUser.role === Role.EMPLOYEE && (!employee || report.employeeId !== employee.id)) {
      throw new ForbiddenException('Access denied: You can only view your own expense reports');
    }

    const expenses = await this.expensesService.getByIds(tenantId, report.expenseIds);
    const approvalSteps = await this.approvalsService.getStepsForReport(tenantId, report.id);
    const auditLog = this.approvalsService.getAuditLog(tenantId, report.id);

    return {
      ...this.mapToDto(report),
      expenses,
      approvalSteps,
      auditLog,
    };
  }

  getRawReportById(tenantId: string, reportId: string): InMemoryReport | undefined {
    const report = this.reports.get(reportId);
    if (report && report.tenantId === tenantId) {
      return report;
    }
    return undefined;
  }

  updateReimbursementStatus(tenantId: string, reportId: string, status: ReimbursementStatus) {
    const report = this.reports.get(reportId);
    if (report && report.tenantId === tenantId) {
      report.reimbursementStatus = status;
      report.updatedAt = new Date().toISOString();
    }
  }

  private mapToDto(rep: InMemoryReport): ReportDto {
    return {
      id: rep.id,
      tenantId: rep.tenantId,
      employeeId: rep.employeeId,
      submittedByName: rep.submittedByName,
      title: rep.title,
      businessPurpose: rep.businessPurpose,
      status: rep.status,
      reimbursementStatus: rep.reimbursementStatus,
      totalAmount: rep.totalAmount,
      reimbursableAmount: rep.reimbursableAmount,
      currency: rep.currency,
      expenseCount: rep.expenseIds.length,
      policyViolations: rep.policyViolations,
      submittedAt: rep.submittedAt,
      approvedAt: rep.approvedAt,
      finalizedAt: rep.finalizedAt,
      createdAt: rep.createdAt,
      updatedAt: rep.updatedAt,
    };
  }
}
