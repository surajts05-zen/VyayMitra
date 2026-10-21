import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Decimal } from 'decimal.js';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseDto,
  ExpenseLineDto,
  ExpenseFilterQuery,
  PresignReceiptUploadInput,
  ConfirmReceiptUploadInput,
  ReceiptDto,
  OcrJobDto,
  ConfirmOcrReviewInput,
  DuplicateMatchDto,
  ExpenseStatus,
  Role,
} from '@vyay/contracts';
import { StubOcrProvider } from '@vyay/integrations';
import { EmployeesService } from '../employees/employees.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface InMemoryReceipt {
  id: string;
  tenantId: string;
  expenseId?: string | null;
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  ocrStatus: 'NONE' | 'QUEUED' | 'PROCESSED' | 'FAILED';
  createdAt: string;
}

interface InMemoryOcrJob {
  id: string;
  tenantId: string;
  receiptId: string;
  expenseId?: string | null;
  provider: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  overallConfidence: number;
  merchant?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  date?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  amount?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  currency?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  invoiceNumber?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  taxAmount?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  gstin?: { value: string; confidence: number; source: 'extracted' | 'inferred' };
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
}

interface InMemoryExpense {
  id: string;
  tenantId: string;
  employeeId: string;
  reportId?: string | null;
  merchant: string;
  invoiceNumber?: string | null;
  spentAt: string;
  currency: string;
  amount: string;
  baseAmount: string;
  subtotal?: string | null;
  taxAmount?: string | null;
  categoryId: string;
  costCenterId?: string | null;
  projectId?: string | null;
  paidBy: any;
  reimbursable: boolean;
  billable: boolean;
  businessPurpose: string;
  status: ExpenseStatus;
  duplicateWarning: boolean;
  duplicateReasons?: string[];
  lines: ExpenseLineDto[];
  receiptIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  private expenses = new Map<string, InMemoryExpense>();
  private receipts = new Map<string, InMemoryReceipt>();
  private ocrJobs = new Map<string, InMemoryOcrJob>();
  private ocrProvider = new StubOcrProvider();

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly prisma: PrismaService
  ) {
    this.seedSampleExpenses();
  }

  private seedSampleExpenses() {
    const t1Id = '11111111-1111-1111-1111-111111111111';
    const rahulEmpId = 'emp-rahul-2222-2222-2222-222222222222';

    const exp1Id = 'exp-1111-1111-1111-111111111111';
    this.expenses.set(exp1Id, {
      id: exp1Id,
      tenantId: t1Id,
      employeeId: rahulEmpId,
      merchant: 'ITC Gardenia Bengaluru',
      invoiceNumber: 'INV-BLR-2026-0921',
      spentAt: '2026-10-15T19:30:00.000Z',
      currency: 'INR',
      amount: '4500.000000',
      baseAmount: '4500.000000',
      subtotal: '3813.560000',
      taxAmount: '686.440000',
      categoryId: 'cat-lodging-1',
      paidBy: 'EMPLOYEE_PERSONAL',
      reimbursable: true,
      billable: false,
      businessPurpose: 'Lodging during National Bio-Tech Annual Summit',
      status: ExpenseStatus.DRAFT,
      duplicateWarning: false,
      lines: [
        {
          id: 'line-1',
          expenseId: exp1Id,
          amount: '4500.000000',
          description: 'Deluxe Room 1 Night + GST 18%',
          createdAt: '2026-10-15T20:00:00.000Z',
        },
      ],
      receiptIds: [],
      createdAt: '2026-10-15T20:00:00.000Z',
      updatedAt: '2026-10-15T20:00:00.000Z',
    });
  }

  // --- Multi-Currency / FX Precision Helper ---
  private calculateBaseAmount(amountStr: string, currency: string): string {
    const amount = new Decimal(amountStr);
    const fxRates: Record<string, string> = {
      INR: '1.0',
      USD: '83.50',
      EUR: '90.25',
      GBP: '105.40',
      SGD: '62.10',
    };
    const rate = new Decimal(fxRates[currency.toUpperCase()] || '1.0');
    return amount.mul(rate).toFixed(6);
  }

  // --- Duplicate Detection Engine ---
  checkDuplicate(
    tenantId: string,
    merchant: string,
    spentAt: string,
    amountStr: string,
    excludeExpenseId?: string
  ): DuplicateMatchDto | null {
    const candidateAmount = new Decimal(amountStr);
    const candidateTime = new Date(spentAt).getTime();
    const cleanMerchant = merchant.trim().toLowerCase();

    for (const exp of this.expenses.values()) {
      if (exp.tenantId !== tenantId || exp.deletedAt) continue;
      if (excludeExpenseId && exp.id === excludeExpenseId) continue;

      const existingAmount = new Decimal(exp.amount);
      const existingTime = new Date(exp.spentAt).getTime();
      const existingMerchant = exp.merchant.trim().toLowerCase();

      // Time proximity: within 2 days (48 hours)
      const diffHours = Math.abs(candidateTime - existingTime) / (1000 * 60 * 60);
      if (diffHours <= 48) {
        // Amount proximity: within 1% tolerance
        const amountDiff = candidateAmount.minus(existingAmount).abs();
        const percentDiff = candidateAmount.isZero() ? new Decimal(0) : amountDiff.div(candidateAmount);

        // Merchant match
        const merchantMatch =
          cleanMerchant === existingMerchant ||
          cleanMerchant.includes(existingMerchant) ||
          existingMerchant.includes(cleanMerchant);

        if (merchantMatch && percentDiff.lte(0.01)) {
          return {
            matchType: 'FUZZY',
            existingExpenseId: exp.id,
            merchant: exp.merchant,
            amount: exp.amount,
            spentAt: exp.spentAt,
            similarityScore: 0.95,
            reason: `Fuzzy duplicate match: similar merchant '${exp.merchant}', amount ₹${exp.amount}, and date within 48h.`,
          };
        }
      }
    }
    return null;
  }

  // --- Receipt Presign & Confirm Flow ---
  async presignReceipt(
    tenantId: string,
    userId: string,
    input: PresignReceiptUploadInput
  ): Promise<{ uploadUrl: string; storageKey: string; receiptId: string; expiresAt: string }> {
    const receiptId = randomUUID();
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${tenantId}/${input.expenseId || 'drafts'}/${receiptId}/${safeName}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min
    const uploadUrl = `https://storage.vyaymitra.internal/upload?key=${encodeURIComponent(storageKey)}&expiry=${expiresAt}`;

    return {
      uploadUrl,
      storageKey,
      receiptId,
      expiresAt,
    };
  }

  async confirmReceipt(
    tenantId: string,
    userId: string,
    input: ConfirmReceiptUploadInput
  ): Promise<{ receipt: ReceiptDto; duplicateMatch: DuplicateMatchDto | null; ocrJob: OcrJobDto }> {
    // 1. Check Exact SHA-256 Hash Duplicate
    let duplicateMatch: DuplicateMatchDto | null = null;
    for (const rec of this.receipts.values()) {
      if (rec.tenantId === tenantId && rec.fileHash === input.fileHash) {
        duplicateMatch = {
          matchType: 'EXACT_HASH',
          existingExpenseId: rec.expenseId || 'unassigned',
          merchant: 'Receipt Hash Match',
          amount: 'Exact',
          spentAt: rec.createdAt,
          similarityScore: 1.0,
          reason: `Exact duplicate detected: identical receipt file hash (${input.fileHash.substring(0, 12)}...) already uploaded.`,
        };
        break;
      }
    }

    const receiptId = randomUUID();
    const receipt: InMemoryReceipt = {
      id: receiptId,
      tenantId,
      expenseId: input.expenseId ?? null,
      storageKey: input.storageKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      fileHash: input.fileHash,
      ocrStatus: 'PROCESSED',
      createdAt: new Date().toISOString(),
    };
    this.receipts.set(receiptId, receipt);

    if (this.prisma?.isConnected && input.expenseId) {
      this.prisma.receipt.create({
        data: {
          id: receiptId,
          expenseId: input.expenseId,
          storageKey: input.storageKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileHash: input.fileHash,
        },
      }).catch((err) => this.logger.warn(`Prisma receipt create warning: ${err.message}`));
    }

    // 2. Run Asynchronous OCR Extraction (Stub Provider)
    const mockBuffer = Buffer.from('mock receipt file content');
    const ocrResult = await this.ocrProvider.extractFromReceipt(receiptId, mockBuffer, input.mimeType);

    const ocrJobId = randomUUID();
    const ocrJob: InMemoryOcrJob = {
      id: ocrJobId,
      tenantId,
      receiptId,
      expenseId: input.expenseId ?? null,
      provider: ocrResult.provider,
      status: 'COMPLETED',
      overallConfidence: ocrResult.overallConfidence,
      merchant: ocrResult.merchant,
      date: ocrResult.date,
      amount: ocrResult.amount,
      currency: ocrResult.currency,
      invoiceNumber: ocrResult.invoiceNumber,
      taxAmount: ocrResult.taxAmount,
      gstin: ocrResult.gstin,
      reviewedAt: null, // Human review gate: must be confirmed before submit!
      reviewedBy: null,
      createdAt: new Date().toISOString(),
    };
    this.ocrJobs.set(ocrJobId, ocrJob);

    return {
      receipt: {
        ...receipt,
        downloadUrl: `https://storage.vyaymitra.internal/receipts/${receipt.id}?tenant=${tenantId}`,
        thumbnailUrl: `https://storage.vyaymitra.internal/receipts/${receipt.id}/thumb`,
      },
      duplicateMatch,
      ocrJob,
    };
  }

  async getReceiptSignedUrl(
    tenantId: string,
    receiptId: string,
    userRole: Role
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const receipt = this.receipts.get(receiptId);
    if (!receipt || receipt.tenantId !== tenantId) {
      throw new NotFoundException('Receipt not found in this organization');
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min expiry
    return {
      downloadUrl: `https://storage.vyaymitra.internal/receipts/${receipt.id}?signedToken=tok_${randomUUID()}&exp=${expiresAt}`,
      expiresAt,
    };
  }

  // --- Human OCR Review Confirmation ---
  async confirmOcrReview(
    tenantId: string,
    userId: string,
    input: ConfirmOcrReviewInput
  ): Promise<OcrJobDto> {
    const job = this.ocrJobs.get(input.ocrJobId);
    if (!job || job.tenantId !== tenantId) {
      throw new NotFoundException('OCR job not found for this tenant');
    }

    job.reviewedAt = new Date().toISOString();
    job.reviewedBy = userId;
    return job;
  }

  // --- Expense CRUD Operations ---
  async create(
    tenantId: string,
    currentUser: { userId: string; email: string; role: Role },
    input: CreateExpenseInput
  ): Promise<ExpenseDto> {
    const employee = await this.employeesService.ensureEmployeeForUser(
      tenantId,
      currentUser.userId,
      currentUser.email
    );

    // Validate Decimal Line Items Sum
    const totalAmount = new Decimal(input.amount);
    let subtotalAmount = input.subtotal ? new Decimal(input.subtotal) : totalAmount;
    let taxAmount = input.taxAmount ? new Decimal(input.taxAmount) : new Decimal(0);

    const expenseLines: ExpenseLineDto[] = [];
    if (input.lines && input.lines.length > 0) {
      let linesSum = new Decimal(0);
      for (const line of input.lines) {
        const lineAmt = new Decimal(line.amount);
        linesSum = linesSum.plus(lineAmt);
        expenseLines.push({
          id: randomUUID(),
          expenseId: '',
          amount: lineAmt.toFixed(6),
          description: line.description,
          costCenterId: line.costCenterId,
          projectId: line.projectId,
          taxMetadata: line.taxMetadata,
          createdAt: new Date().toISOString(),
        });
      }

      if (!linesSum.equals(totalAmount)) {
        throw new BadRequestException(
          `Line items sum (${linesSum.toFixed(2)}) must equal total expense amount (${totalAmount.toFixed(2)})`
        );
      }
    } else {
      expenseLines.push({
        id: randomUUID(),
        expenseId: '',
        amount: totalAmount.toFixed(6),
        description: input.businessPurpose,
        costCenterId: input.costCenterId,
        projectId: input.projectId,
        taxMetadata: input.taxMetadata,
        createdAt: new Date().toISOString(),
      });
    }

    // Duplicate detection check
    const duplicate = this.checkDuplicate(
      tenantId,
      input.merchant,
      input.spentAt,
      input.amount
    );

    const id = randomUUID();
    const baseAmount = this.calculateBaseAmount(input.amount, input.currency);

    const expense: InMemoryExpense = {
      id,
      tenantId,
      employeeId: employee.id,
      merchant: input.merchant,
      invoiceNumber: input.invoiceNumber ?? null,
      spentAt: input.spentAt,
      currency: input.currency.toUpperCase(),
      amount: totalAmount.toFixed(6),
      baseAmount,
      subtotal: subtotalAmount.toFixed(6),
      taxAmount: taxAmount.toFixed(6),
      categoryId: input.categoryId,
      costCenterId: input.costCenterId ?? null,
      projectId: input.projectId ?? null,
      paidBy: input.paidBy,
      reimbursable: input.reimbursable,
      billable: input.billable ?? false,
      businessPurpose: input.businessPurpose,
      status: ExpenseStatus.DRAFT,
      duplicateWarning: !!duplicate,
      duplicateReasons: duplicate ? [duplicate.reason] : [],
      lines: expenseLines.map((l) => ({ ...l, expenseId: id })),
      receiptIds: input.receiptIds ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attach receipts if provided
    if (input.receiptIds && input.receiptIds.length > 0) {
      for (const recId of input.receiptIds) {
        const rec = this.receipts.get(recId);
        if (rec && rec.tenantId === tenantId) {
          rec.expenseId = id;
        }
      }
    }

    this.expenses.set(id, expense);

    if (this.prisma?.isConnected) {
      this.prisma.expense.create({
        data: {
          id,
          tenantId,
          employeeId: employee.id,
          merchant: input.merchant,
          invoiceNumber: input.invoiceNumber ?? null,
          spentAt: new Date(input.spentAt),
          currency: input.currency.toUpperCase(),
          amount: totalAmount.toFixed(6),
          baseAmount,
          subtotal: subtotalAmount.toFixed(6),
          taxAmount: taxAmount.toFixed(6),
          categoryId: input.categoryId,
          paidBy: input.paidBy,
          reimbursable: input.reimbursable,
          billable: input.billable ?? false,
          businessPurpose: input.businessPurpose,
          status: ExpenseStatus.DRAFT,
          lines: {
            create: expenseLines.map((l) => ({
              id: l.id,
              amount: l.amount,
              description: l.description,
              costCenterId: l.costCenterId ?? null,
              projectId: l.projectId ?? null,
              taxMetadata: l.taxMetadata as any,
            })),
          },
        },
      }).catch((err) => this.logger.warn(`Prisma expense create warning: ${err.message}`));
    }

    return {
      id: expense.id,
      tenantId: expense.tenantId,
      employeeId: expense.employeeId,
      reportId: expense.reportId,
      merchant: expense.merchant,
      invoiceNumber: expense.invoiceNumber,
      spentAt: expense.spentAt,
      currency: expense.currency,
      amount: expense.amount,
      baseAmount: expense.baseAmount,
      subtotal: expense.subtotal,
      taxAmount: expense.taxAmount,
      categoryId: expense.categoryId,
      paidBy: expense.paidBy,
      reimbursable: expense.reimbursable,
      billable: expense.billable,
      businessPurpose: expense.businessPurpose,
      status: expense.status,
      duplicateWarning: expense.duplicateWarning,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  async findAll(
    tenantId: string,
    currentUser: { userId: string; role: Role },
    query: ExpenseFilterQuery
  ): Promise<ExpenseDto[]> {
    const employee = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    const results: ExpenseDto[] = [];

    for (const exp of this.expenses.values()) {
      if (exp.tenantId !== tenantId || exp.deletedAt) continue;

      // Access policy: Regular employee can only see their own expenses
      if (currentUser.role === Role.EMPLOYEE) {
        if (!employee || exp.employeeId !== employee.id) continue;
      }

      // Query filters
      if (query.status && exp.status !== query.status) continue;
      if (query.categoryId && exp.categoryId !== query.categoryId) continue;
      if (query.employeeId && exp.employeeId !== query.employeeId) continue;
      if (query.reimbursable !== undefined && exp.reimbursable !== query.reimbursable) continue;
      if (query.startDate && new Date(exp.spentAt) < new Date(query.startDate)) continue;
      if (query.endDate && new Date(exp.spentAt) > new Date(query.endDate)) continue;

      results.push({
        id: exp.id,
        tenantId: exp.tenantId,
        employeeId: exp.employeeId,
        reportId: exp.reportId,
        merchant: exp.merchant,
        invoiceNumber: exp.invoiceNumber,
        spentAt: exp.spentAt,
        currency: exp.currency,
        amount: exp.amount,
        baseAmount: exp.baseAmount,
        subtotal: exp.subtotal,
        taxAmount: exp.taxAmount,
        categoryId: exp.categoryId,
        paidBy: exp.paidBy,
        reimbursable: exp.reimbursable,
        billable: exp.billable,
        businessPurpose: exp.businessPurpose,
        status: exp.status,
        duplicateWarning: exp.duplicateWarning,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
      });
    }

    // Sort descending by spentAt
    results.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());

    const total = results.length;
    const paginated = results.slice(query.offset, query.offset + query.limit);
    return paginated;
  }

  async findById(
    tenantId: string,
    expenseId: string,
    currentUser: { userId: string; role: Role }
  ): Promise<ExpenseDto & { lines: ExpenseLineDto[]; receiptUrls: string[]; duplicateReasons?: string[] }> {
    const exp = this.expenses.get(expenseId);
    if (!exp || exp.tenantId !== tenantId || exp.deletedAt) {
      throw new NotFoundException(`Expense with id ${expenseId} not found in this organization`);
    }

    const employee = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    if (currentUser.role === Role.EMPLOYEE && (!employee || exp.employeeId !== employee.id)) {
      throw new ForbiddenException('Access denied: You can only view your own expenses');
    }

    const receiptUrls = exp.receiptIds.map(
      (id) => `https://storage.vyaymitra.internal/receipts/${id}?tenant=${tenantId}`
    );

    return {
      ...exp,
      lines: exp.lines,
      receiptUrls,
      duplicateReasons: exp.duplicateReasons,
    };
  }

  async update(
    tenantId: string,
    expenseId: string,
    currentUser: { userId: string; role: Role },
    input: UpdateExpenseInput
  ): Promise<ExpenseDto> {
    const exp = this.expenses.get(expenseId);
    if (!exp || exp.tenantId !== tenantId || exp.deletedAt) {
      throw new NotFoundException(`Expense with id ${expenseId} not found in this organization`);
    }

    const employee = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    if (currentUser.role === Role.EMPLOYEE && (!employee || exp.employeeId !== employee.id)) {
      throw new ForbiddenException('Access denied: You can only edit your own expenses');
    }

    if (exp.status !== ExpenseStatus.DRAFT && exp.status !== ExpenseStatus.REJECTED) {
      throw new BadRequestException(`Cannot edit expense in status '${exp.status}'. Only DRAFT or REJECTED expenses can be edited.`);
    }

    if (input.merchant) exp.merchant = input.merchant;
    if (input.invoiceNumber !== undefined) exp.invoiceNumber = input.invoiceNumber ?? null;
    if (input.spentAt) exp.spentAt = input.spentAt;
    if (input.currency) {
      exp.currency = input.currency.toUpperCase();
      exp.baseAmount = this.calculateBaseAmount(exp.amount, exp.currency);
    }
    if (input.amount) {
      exp.amount = new Decimal(input.amount).toFixed(6);
      exp.baseAmount = this.calculateBaseAmount(exp.amount, exp.currency);
    }
    if (input.businessPurpose) exp.businessPurpose = input.businessPurpose;
    if (input.categoryId) exp.categoryId = input.categoryId;
    if (input.costCenterId !== undefined) exp.costCenterId = input.costCenterId ?? null;
    if (input.projectId !== undefined) exp.projectId = input.projectId ?? null;
    if (input.reimbursable !== undefined) exp.reimbursable = input.reimbursable;
    if (input.billable !== undefined) exp.billable = input.billable;

    exp.updatedAt = new Date().toISOString();
    if (this.prisma?.isConnected) {
      this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          merchant: exp.merchant,
          invoiceNumber: exp.invoiceNumber,
          spentAt: new Date(exp.spentAt),
          currency: exp.currency,
          amount: exp.amount,
          baseAmount: exp.baseAmount,
          subtotal: exp.subtotal,
          taxAmount: exp.taxAmount,
          categoryId: exp.categoryId,
          businessPurpose: exp.businessPurpose,
        },
      }).catch((err) => this.logger.warn(`Prisma expense update warning: ${err.message}`));
    }
    return {
      id: exp.id,
      tenantId: exp.tenantId,
      employeeId: exp.employeeId,
      reportId: exp.reportId,
      merchant: exp.merchant,
      invoiceNumber: exp.invoiceNumber,
      spentAt: exp.spentAt,
      currency: exp.currency,
      amount: exp.amount,
      baseAmount: exp.baseAmount,
      subtotal: exp.subtotal,
      taxAmount: exp.taxAmount,
      categoryId: exp.categoryId,
      paidBy: exp.paidBy,
      reimbursable: exp.reimbursable,
      billable: exp.billable,
      businessPurpose: exp.businessPurpose,
      status: exp.status,
      duplicateWarning: exp.duplicateWarning,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
    };
  }

  async remove(
    tenantId: string,
    expenseId: string,
    currentUser: { userId: string; role: Role }
  ): Promise<{ success: boolean; message: string }> {
    const exp = this.expenses.get(expenseId);
    if (!exp || exp.tenantId !== tenantId || exp.deletedAt) {
      throw new NotFoundException(`Expense with id ${expenseId} not found in this organization`);
    }

    const employee = await this.employeesService.findByUserId(tenantId, currentUser.userId);
    if (currentUser.role === Role.EMPLOYEE && (!employee || exp.employeeId !== employee.id)) {
      throw new ForbiddenException('Access denied: You can only delete your own expenses');
    }

    if (exp.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException(`Cannot delete expense in status '${exp.status}'. Only DRAFT expenses can be deleted.`);
    }

    exp.deletedAt = new Date().toISOString();
    if (this.prisma?.isConnected) {
      this.prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'DELETED' },
      }).catch((err) => this.logger.warn(`Prisma expense delete warning: ${err.message}`));
    }
    return { success: true, message: 'Expense deleted successfully' };
  }

  // --- Reports Module Integration Helpers ---
  async getByIds(tenantId: string, ids: string[]): Promise<InMemoryExpense[]> {
    const list: InMemoryExpense[] = [];
    for (const id of ids) {
      const exp = this.expenses.get(id);
      if (exp && exp.tenantId === tenantId && !exp.deletedAt) {
        list.push(exp);
      }
    }
    return list;
  }

  async attachToReport(tenantId: string, expenseIds: string[], reportId: string): Promise<void> {
    for (const id of expenseIds) {
      const exp = this.expenses.get(id);
      if (exp && exp.tenantId === tenantId) {
        exp.reportId = reportId;
        exp.status = ExpenseStatus.SUBMITTED;
        exp.updatedAt = new Date().toISOString();
      }
    }
  }

  async unlockFromReport(tenantId: string, expenseIds: string[], newStatus: ExpenseStatus = ExpenseStatus.DRAFT): Promise<void> {
    for (const id of expenseIds) {
      const exp = this.expenses.get(id);
      if (exp && exp.tenantId === tenantId) {
        exp.reportId = null;
        exp.status = newStatus;
        exp.updatedAt = new Date().toISOString();
      }
    }
  }

  async lockForReport(tenantId: string, expenseIds: string[]): Promise<void> {
    for (const id of expenseIds) {
      const exp = this.expenses.get(id);
      if (exp && exp.tenantId === tenantId) {
        exp.status = ExpenseStatus.LOCKED;
        exp.updatedAt = new Date().toISOString();
      }
    }
  }

  async purgeTenantExpenses(tenantId: string): Promise<number> {
    let count = 0;
    for (const [id, exp] of this.expenses.entries()) {
      if (exp.tenantId === tenantId) {
        this.expenses.delete(id);
        count++;
      }
    }
    if (this.prisma?.isConnected) {
      try {
        await this.prisma.expense.deleteMany({ where: { tenantId } });
      } catch (err) {
        this.logger.warn(`Prisma purge expenses warning: ${(err as Error).message}`);
      }
    }
    return count;
  }
}
