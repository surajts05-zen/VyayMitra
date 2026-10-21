import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ReimbursementDto,
  ReimbursementPaymentDto,
  RecordPaymentInput,
  ReimbursementFilterQuery,
  ReimbursementStatus,
  ReportStatus,
  PaymentMethod,
  Role,
  Money,
} from '@vyay/contracts';
import { ReportsService } from '../reports/reports.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReimbursementsService {
  private readonly logger = new Logger(ReimbursementsService.name);
  private reimbursements: Map<string, ReimbursementDto> = new Map();
  private onPaymentRecorded?: (tenantId: string, reportId: string, status: ReimbursementStatus) => Promise<void>;

  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService
  ) {
    this.seedBaselineReimbursements();
  }

  registerPaymentRecordedHandler(
    handler: (tenantId: string, reportId: string, status: ReimbursementStatus) => Promise<void>
  ) {
    this.onPaymentRecorded = handler;
  }

  private async syncApprovedReports(tenantId: string) {
    const reports = await this.reportsService.findAll(
      tenantId,
      { userId: '00000000-0000-0000-0000-000000000000', role: Role.COMPANY_OWNER },
      { status: ReportStatus.APPROVED, limit: 100, offset: 0 }
    );
    for (const rep of reports) {
      if (parseFloat(rep.reimbursableAmount) > 0) {
        this.ensureReimbursementForReport(tenantId, rep);
      }
    }
  }

  private seedBaselineReimbursements() {
    const tenant1 = '11111111-1111-1111-1111-111111111111'; // Acme BioTech Pvt Ltd
    const rahulEmployeeId = 'emp-rahul-2222-2222-2222-222222222222';

    // Seed eligible reimbursement for standard report
    const r1: ReimbursementDto = {
      id: 'reimb-001',
      tenantId: tenant1,
      reportId: 'rep-001',
      reportTitle: 'Bangalore Lab Equipment & Reagents',
      reportNumber: 'REP-2026-0891',
      employeeId: rahulEmployeeId,
      employeeName: 'Dr. Rahul Sharma',
      currency: 'INR',
      eligibleAmount: '8450.00',
      paidAmount: '0.00',
      remainingAmount: '8450.00',
      status: ReimbursementStatus.ELIGIBLE,
      payments: [],
      createdAt: '2026-10-18T14:20:00Z',
      updatedAt: '2026-10-18T14:20:00Z',
    };
    this.reimbursements.set(r1.id, r1);
  }

  ensureReimbursementForReport(
    tenantId: string,
    report: {
      id: string;
      employeeId: string;
      employeeName?: string;
      title: string;
      reportNumber?: string;
      reimbursableAmount: string;
      currency: string;
    }
  ): ReimbursementDto {
    // Check if reimbursement record already exists for this report
    for (const r of this.reimbursements.values()) {
      if (r.tenantId === tenantId && r.reportId === report.id) {
        return r;
      }
    }

    const eligible = Money.from(report.reimbursableAmount);
    const isApplicable = eligible.isGreaterThan(0);

    const newReimb: ReimbursementDto = {
      id: randomUUID(),
      tenantId,
      reportId: report.id,
      reportTitle: report.title,
      reportNumber: report.reportNumber || `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: report.employeeId,
      employeeName: report.employeeName || 'Employee',
      currency: report.currency,
      eligibleAmount: eligible.toFixed(2),
      paidAmount: '0.00',
      remainingAmount: eligible.toFixed(2),
      status: isApplicable ? ReimbursementStatus.ELIGIBLE : ReimbursementStatus.NOT_APPLICABLE,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reimbursements.set(newReimb.id, newReimb);
    return newReimb;
  }

  async findAll(
    tenantId: string,
    currentUser: { userId: string; role: Role; employeeId?: string },
    query: ReimbursementFilterQuery
  ): Promise<ReimbursementDto[]> {
    await this.syncApprovedReports(tenantId);
    const results: ReimbursementDto[] = [];

    for (const r of this.reimbursements.values()) {
      if (r.tenantId !== tenantId) continue;

      // Scoping: Employees can only view their own reimbursements
      if (currentUser.role === Role.EMPLOYEE) {
        if (currentUser.employeeId && r.employeeId !== currentUser.employeeId) {
          continue;
        }
      }

      if (query.status && r.status !== query.status) continue;
      if (query.employeeId && r.employeeId !== query.employeeId) continue;
      if (query.reportId && r.reportId !== query.reportId) continue;

      results.push(r);
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results.slice(query.offset, query.offset + query.limit);
  }

  async findById(
    tenantId: string,
    id: string,
    currentUser: { userId: string; role: Role; employeeId?: string }
  ): Promise<ReimbursementDto> {
    await this.syncApprovedReports(tenantId);
    const reimb = this.reimbursements.get(id);
    if (!reimb || reimb.tenantId !== tenantId) {
      throw new NotFoundException(`Reimbursement record with id ${id} not found in this organization`);
    }

    if (currentUser.role === Role.EMPLOYEE) {
      if (currentUser.employeeId && reimb.employeeId !== currentUser.employeeId) {
        throw new ForbiddenException('You are not authorized to view this reimbursement record');
      }
    }

    return reimb;
  }

  async findByReportId(tenantId: string, reportId: string): Promise<ReimbursementDto | null> {
    await this.syncApprovedReports(tenantId);
    for (const r of this.reimbursements.values()) {
      if (r.tenantId === tenantId && r.reportId === reportId) {
        return r;
      }
    }
    return null;
  }

  // --- Disbursement & Partial Payment Recording Engine ---

  async recordPayment(
    tenantId: string,
    reimbursementId: string,
    currentUser: { userId: string; email: string; role: Role },
    input: RecordPaymentInput
  ): Promise<{ reimbursement: ReimbursementDto; payment: ReimbursementPaymentDto }> {
    // 1. RBAC Check: Only Finance Roles and Company Owners can disburse funds
    const isAuthorizedFinance =
      currentUser.role === Role.FINANCE_OPERATOR ||
      currentUser.role === Role.FINANCE_ADMIN ||
      currentUser.role === Role.COMPANY_OWNER;

    if (!isAuthorizedFinance) {
      throw new ForbiddenException(
        'Permission denied: Only Finance Operators, Finance Admins, or Company Owners can record reimbursement payouts.'
      );
    }

    // 2. Fetch and tenant-scope reimbursement record
    const reimb = this.reimbursements.get(reimbursementId);
    if (!reimb || reimb.tenantId !== tenantId) {
      throw new NotFoundException(`Reimbursement record with id ${reimbursementId} not found`);
    }

    // 3. Status Gate: Cannot reimburse non-applicable or cancelled reports
    if (reimb.status === ReimbursementStatus.NOT_APPLICABLE) {
      throw new BadRequestException(
        'Cannot disburse reimbursement on non-reimbursable claims (e.g. Corporate Card direct expense).'
      );
    }
    if (reimb.status === ReimbursementStatus.CANCELLED) {
      throw new BadRequestException('Cannot disburse reimbursement on cancelled claims.');
    }
    if (reimb.status === ReimbursementStatus.PAID) {
      throw new BadRequestException('This claim has already been fully paid and settled.');
    }

    // 4. Validate Amount Arithmetic using Decimal precision
    const paymentAmount = Money.from(input.amount);
    if (!paymentAmount.isGreaterThan(0)) {
      throw new BadRequestException('Disbursement payment amount must be greater than zero.');
    }

    const remaining = Money.from(reimb.remainingAmount);
    if (paymentAmount.isGreaterThan(remaining)) {
      throw new BadRequestException(
        `Payment amount (₹${paymentAmount.toFixed(2)}) exceeds remaining eligible balance of ₹${remaining.toFixed(2)}.`
      );
    }

    // 5. Anti-Duplicate Payout Gate: Transaction reference must be unique for this reimbursement
    const normalizedRef = input.transactionRef.trim().toLowerCase();
    const isDuplicateRef = reimb.payments.some(
      (p) => p.transactionRef.trim().toLowerCase() === normalizedRef
    );
    if (isDuplicateRef) {
      throw new BadRequestException(
        `Duplicate payment reference: Transaction reference '${input.transactionRef}' has already been recorded for this claim.`
      );
    }

    // 6. Compute new balances with exact decimal precision
    const newPaidAmount = Money.from(reimb.paidAmount).add(paymentAmount).toFixed(2);
    const newRemainingAmount = remaining.sub(paymentAmount).toFixed(2);
    const isFullySettled = Money.from(newRemainingAmount).isZero();

    const newStatus = isFullySettled
      ? ReimbursementStatus.PAID
      : ReimbursementStatus.PARTIALLY_PAID;

    // 7. Create Immutable Payment Record
    const payment: ReimbursementPaymentDto = {
      id: randomUUID(),
      reimbursementId: reimb.id,
      amount: paymentAmount.toFixed(2),
      paidAt: input.paidAt || new Date().toISOString(),
      method: input.method,
      transactionRef: input.transactionRef.trim(),
      payerBankAccount: input.payerBankAccount || null,
      recordedBy: currentUser.userId,
      recordedByName: currentUser.email,
      notes: input.notes || null,
      createdAt: new Date().toISOString(),
    };

    reimb.payments.push(payment);
    reimb.paidAmount = newPaidAmount;
    reimb.remainingAmount = newRemainingAmount;
    reimb.status = newStatus;
    reimb.updatedAt = new Date().toISOString();

    if (this.prisma?.isConnected) {
      try {
        await this.prisma.$transaction([
          this.prisma.reimbursementPayment.create({
            data: {
              id: payment.id,
              reimbursementId: reimb.id,
              amount: payment.amount,
              paidAt: new Date(payment.paidAt),
              method: payment.method,
              transactionRef: payment.transactionRef,
              recordedBy: currentUser.userId,
              notes: payment.notes,
            },
          }),
          this.prisma.reimbursement.update({
            where: { id: reimb.id },
            data: {
              paidAmount: newPaidAmount,
              remainingAmount: newRemainingAmount,
              status: newStatus,
            },
          }),
        ]);
      } catch (err) {
        this.logger.warn(`Prisma reimbursement payment persistence warning: ${(err as Error).message}`);
      }
    }

    // 8. Synchronize with Report State
    this.reportsService.updateReimbursementStatus(tenantId, reimb.reportId, newStatus);
    if (this.onPaymentRecorded) {
      await this.onPaymentRecorded(tenantId, reimb.reportId, newStatus);
    }

    return {
      reimbursement: reimb,
      payment,
    };
  }
}
