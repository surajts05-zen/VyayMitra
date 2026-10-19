import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ApprovalDecision,
  ApprovalDecisionInput,
  ApprovalStepDto,
  CreateDelegationInput,
  DelegationDto,
  Role,
} from '@vyay/contracts';
import { PolicyEvaluationResult } from './policy.service.js';
import { EmployeesService } from '../employees/employees.service.js';

export interface InMemoryApprovalStep {
  id: string;
  tenantId: string;
  reportId: string;
  submittedByUserId: string;
  sequence: number;
  stepName: string;
  approverId: string; // userId or employeeId
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'DELEGATED';
  decidedAt?: string | null;
  comment?: string | null;
  delegatedFrom?: string | null;
  createdAt: string;
}

export interface InMemoryDelegation {
  id: string;
  tenantId: string;
  delegatorUserId: string;
  delegatorName: string;
  delegateUserId: string;
  delegateName: string;
  scope: 'ALL' | 'DEPARTMENT' | 'AMOUNT_LIMIT';
  amountLimit?: string | null;
  effectiveFrom: string;
  effectiveUntil: string;
  active: boolean;
  reason?: string | null;
  createdAt: string;
}

export interface ImmutableApprovalAction {
  id: string;
  tenantId: string;
  stepId: string;
  reportId: string;
  actorUserId: string;
  actorName: string;
  decision: ApprovalDecision;
  comment?: string | null;
  delegatedFrom?: string | null;
  timestamp: string;
}

@Injectable()
export class ApprovalsService {
  private steps = new Map<string, InMemoryApprovalStep>();
  private delegations = new Map<string, InMemoryDelegation>();
  private auditLog: ImmutableApprovalAction[] = [];
  private onStepDecided?: (
    tenantId: string,
    reportId: string,
    decision: ApprovalDecision,
    isFullyApproved: boolean
  ) => Promise<void>;

  registerReportDecisionHandler(
    handler: (
      tenantId: string,
      reportId: string,
      decision: ApprovalDecision,
      isFullyApproved: boolean
    ) => Promise<void>
  ) {
    this.onStepDecided = handler;
  }

  constructor(private readonly employeesService: EmployeesService) {
    this.seedBaselineSteps();
  }

  private seedBaselineSteps() {
    // Seed default delegations if needed
  }

  // --- Delegation Engine ---
  async createDelegation(
    tenantId: string,
    currentUser: { userId: string; email: string },
    input: CreateDelegationInput
  ): Promise<DelegationDto> {
    // Self-delegation prevention
    if (input.delegateUserId === currentUser.userId) {
      throw new BadRequestException('Self-delegation is prohibited. You cannot delegate approval authority to yourself.');
    }

    const start = new Date(input.effectiveFrom).getTime();
    const end = new Date(input.effectiveUntil).getTime();
    if (isNaN(start) || isNaN(end) || start >= end) {
      throw new BadRequestException('Invalid delegation timeframe: effectiveFrom must be before effectiveUntil');
    }

    const id = randomUUID();
    const delegatorEmp = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    const delegateEmp = await this.employeesService.findByUserId(tenantId, input.delegateUserId);

    const delegation: InMemoryDelegation = {
      id,
      tenantId,
      delegatorUserId: currentUser.userId,
      delegatorName: delegatorEmp ? delegatorEmp.displayName : currentUser.email,
      delegateUserId: input.delegateUserId,
      delegateName: delegateEmp ? delegateEmp.displayName : 'Authorized Delegate',
      scope: input.scope,
      amountLimit: input.amountLimit ?? null,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil,
      active: true,
      reason: input.reason ?? null,
      createdAt: new Date().toISOString(),
    };

    this.delegations.set(id, delegation);
    return delegation;
  }

  async listDelegations(tenantId: string, userId?: string): Promise<DelegationDto[]> {
    const results: DelegationDto[] = [];
    for (const d of this.delegations.values()) {
      if (d.tenantId === tenantId) {
        if (!userId || d.delegatorUserId === userId || d.delegateUserId === userId) {
          results.push(d);
        }
      }
    }
    return results;
  }

  hasActiveDelegation(tenantId: string, delegatorUserId: string, delegateUserId: string): boolean {
    const now = Date.now();
    for (const d of this.delegations.values()) {
      if (
        d.tenantId === tenantId &&
        d.active &&
        d.delegatorUserId === delegatorUserId &&
        d.delegateUserId === delegateUserId
      ) {
        const start = new Date(d.effectiveFrom).getTime();
        const end = new Date(d.effectiveUntil).getTime();
        if (now >= start && now <= end) {
          return true;
        }
      }
    }
    return false;
  }

  // --- Approval Flow Instantiation ---
  async createApprovalFlow(
    tenantId: string,
    report: { id: string; employeeId: string; submittedByUserId: string; totalAmount: string },
    policyResult: PolicyEvaluationResult
  ): Promise<ApprovalStepDto[]> {
    // Clear any previous steps for this report on resubmission (historical decisions remain in auditLog)
    for (const [id, s] of this.steps.entries()) {
      if (s.tenantId === tenantId && s.reportId === report.id) {
        this.steps.delete(id);
      }
    }

    const employee = await this.employeesService.findById(tenantId, report.employeeId);
    const steps: InMemoryApprovalStep[] = [];
    let sequence = 1;

    // Step 1: Direct Manager (or Owner if no manager assigned)
    let managerUserId = 'cccc3333-3333-3333-3333-333333333333'; // Anita Deshmukh (Manager)
    let managerName = 'Anita Deshmukh (Manager)';

    if (employee.managerId) {
      const mgr = await this.employeesService.findById(tenantId, employee.managerId);
      if (mgr && mgr.userId) {
        managerUserId = mgr.userId;
        managerName = `${mgr.displayName} (Manager)`;
      }
    }

    const step1: InMemoryApprovalStep = {
      id: randomUUID(),
      tenantId,
      reportId: report.id,
      submittedByUserId: report.submittedByUserId,
      sequence: sequence++,
      stepName: 'Manager Approval',
      approverId: managerUserId,
      approverName: managerName,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    steps.push(step1);
    this.steps.set(step1.id, step1);

    // Step 2: Policy-triggered Executive / Owner Escalation (e.g. > ₹50,000)
    if (policyResult.requiresEscalation) {
      const step2: InMemoryApprovalStep = {
        id: randomUUID(),
        tenantId,
        reportId: report.id,
        submittedByUserId: report.submittedByUserId,
        sequence: sequence++,
        stepName: 'Executive Escalation Approval',
        approverId: 'aaaa1111-1111-1111-1111-111111111111', // Vikram Mehta (Company Owner)
        approverName: 'Vikram Mehta (Company Owner)',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      steps.push(step2);
      this.steps.set(step2.id, step2);
    }

    // Step 3: Finance Review
    const step3: InMemoryApprovalStep = {
      id: randomUUID(),
      tenantId,
      reportId: report.id,
      submittedByUserId: report.submittedByUserId,
      sequence: sequence++,
      stepName: 'Finance Audit & Review',
      approverId: 'bbbb2222-2222-2222-2222-222222222222', // Sarah Jenkins (Finance Operator)
      approverName: 'Sarah Jenkins (Finance Review)',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    steps.push(step3);
    this.steps.set(step3.id, step3);

    return steps;
  }

  async getStepsForReport(tenantId: string, reportId: string): Promise<ApprovalStepDto[]> {
    const list: ApprovalStepDto[] = [];
    for (const s of this.steps.values()) {
      if (s.tenantId === tenantId && s.reportId === reportId) {
        list.push(s);
      }
    }
    return list.sort((a, b) => a.sequence - b.sequence);
  }

  async getStepById(tenantId: string, stepId: string): Promise<InMemoryApprovalStep> {
    const step = this.steps.get(stepId);
    if (!step || step.tenantId !== tenantId) {
      throw new NotFoundException(`Approval step with id ${stepId} not found`);
    }
    return step;
  }

  async getPendingInbox(
    tenantId: string,
    currentUser: { userId: string; role: Role }
  ): Promise<ApprovalStepDto[]> {
    const results: ApprovalStepDto[] = [];

    for (const step of this.steps.values()) {
      if (step.tenantId !== tenantId) continue;
      if (step.status !== 'PENDING') continue;

      const isDirectApprover = step.approverId === currentUser.userId;
      const isDelegate = this.hasActiveDelegation(tenantId, step.approverId, currentUser.userId);
      const isFinance =
        (currentUser.role === Role.FINANCE_OPERATOR || currentUser.role === Role.FINANCE_ADMIN) &&
        step.stepName.includes('Finance');
      const isOwner = currentUser.role === Role.COMPANY_OWNER;

      if (isDirectApprover || isDelegate || isFinance || isOwner) {
        results.push(step);
      }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Step Decision & Audit Trail ---
  async decide(
    tenantId: string,
    stepId: string,
    currentUser: { userId: string; email: string; role: Role },
    report: { id: string; submittedByUserId?: string },
    input: ApprovalDecisionInput
  ): Promise<{ step: ApprovalStepDto; isFullyApproved: boolean; nextStep?: ApprovalStepDto }> {
    const step = await this.getStepById(tenantId, stepId);

    // 1. HARD SECURITY RULE: Self-Approval Prevention Gate
    const submitter = step.submittedByUserId || report?.submittedByUserId;
    if (submitter && submitter === currentUser.userId) {
      throw new ForbiddenException(
        'Self-approval is strictly forbidden. Submitter cannot approve or decide on their own expense report.'
      );
    }

    // 2. Authorization check (Direct approver, active delegate, or Finance/Owner override)
    const isDirectApprover = step.approverId === currentUser.userId;
    const isDelegate = this.hasActiveDelegation(tenantId, step.approverId, currentUser.userId);
    const isAuthorizedRole =
      currentUser.role === Role.COMPANY_OWNER ||
      (step.stepName.includes('Finance') &&
        (currentUser.role === Role.FINANCE_OPERATOR || currentUser.role === Role.FINANCE_ADMIN));

    if (!isDirectApprover && !isDelegate && !isAuthorizedRole) {
      throw new ForbiddenException('You are not authorized to decide on this approval step.');
    }

    // 3. Validation on mandatory comment for rejection / changes requested
    if (
      (input.decision === ApprovalDecision.REJECTED || input.decision === ApprovalDecision.CHANGES_REQUESTED) &&
      (!input.comment || input.comment.trim().length < 3)
    ) {
      throw new BadRequestException('A descriptive comment is mandatory when requesting changes or rejecting a report.');
    }

    // 4. Record Immutable Audit Action
    const action: ImmutableApprovalAction = {
      id: randomUUID(),
      tenantId,
      stepId: step.id,
      reportId: step.reportId,
      actorUserId: currentUser.userId,
      actorName: currentUser.email,
      decision: input.decision,
      comment: input.comment ?? null,
      delegatedFrom: isDelegate ? step.approverId : null,
      timestamp: new Date().toISOString(),
    };
    this.auditLog.push(action);

    // 5. Update Step
    step.status = input.decision as any;
    step.decidedAt = new Date().toISOString();
    step.comment = input.comment ?? null;
    if (isDelegate) {
      step.delegatedFrom = step.approverId;
    }

    if (input.decision === ApprovalDecision.DELEGATED) {
      if (!input.delegateId) {
        throw new BadRequestException('delegateId is required when delegating an approval step');
      }
      step.approverId = input.delegateId;
      step.approverName = 'Assigned Delegate';
      step.status = 'PENDING';
      return { step, isFullyApproved: false };
    }

    // 6. Check if there are subsequent steps
    const allSteps = await this.getStepsForReport(tenantId, step.reportId);
    const pendingSteps = allSteps.filter((s) => s.status === 'PENDING' && s.id !== step.id);
    const isFullyApproved = input.decision === ApprovalDecision.APPROVED && pendingSteps.length === 0;
    const nextStep = pendingSteps.length > 0 ? pendingSteps[0] : undefined;

    // 7. Invoke Report Decision Handler to sync report and expense state
    if (this.onStepDecided) {
      await this.onStepDecided(tenantId, step.reportId, input.decision, isFullyApproved);
    }

    return {
      step,
      isFullyApproved,
      nextStep,
    };
  }

  getAuditLog(tenantId: string, reportId: string): ImmutableApprovalAction[] {
    return this.auditLog.filter((a) => a.tenantId === tenantId && a.reportId === reportId);
  }
}
