import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  GLAccountMapping,
  UpdateGLAccountMappingInput,
  TaxTreatment,
  FinanceValidationInput,
  BudgetDto,
  CreateBudgetInput,
  Money,
  ReportStatus,
} from '@vyay/contracts';

interface ReportReviewItem {
  reportId: string;
  tenantId: string;
  reportNumber: string;
  title: string;
  employeeName: string;
  totalAmount: string;
  reimbursableAmount: string;
  currency: string;
  status: ReportStatus;
  submittedAt: string;
  approvedAt?: string;
  documentationVerified: boolean;
  glAccountsVerified: boolean;
  taxTreatmentVerified: boolean;
  remarks?: string;
}

@Injectable()
export class FinanceService {
  // In-memory GL Account & Tax Mappings
  private glMappings: Map<string, GLAccountMapping[]> = new Map();

  // In-memory Budgets
  private budgets: Map<string, BudgetDto[]> = new Map();

  // Pre-payment verification records
  private verificationRecords: Map<string, ReportReviewItem> = new Map();

  constructor() {
    this.seedDefaultMappings();
    this.seedDefaultBudgets();
  }

  private seedDefaultMappings() {
    const tenant1 = '11111111-1111-1111-1111-111111111111'; // Acme BioTech Pvt Ltd
    const mappings: GLAccountMapping[] = [
      {
        categoryId: 'cat-air-travel',
        categoryName: 'Air Travel',
        glCode: '6010',
        glAccountName: 'Domestic & International Airfare',
        taxTreatment: TaxTreatment.ITC_ELIGIBLE,
      },
      {
        categoryId: 'cat-ground-commute',
        categoryName: 'Ground Commute & Taxis',
        glCode: '6015',
        glAccountName: 'Local Conveyance & Vehicle Hire',
        taxTreatment: TaxTreatment.ITC_INELIGIBLE, // Taxi passenger transport blocked ITC u/s 17(5)
      },
      {
        categoryId: 'cat-hotel-stay',
        categoryName: 'Accommodation',
        glCode: '6020',
        glAccountName: 'Lodging & Hotel Accommodation',
        taxTreatment: TaxTreatment.ITC_ELIGIBLE,
      },
      {
        categoryId: 'cat-client-meals',
        categoryName: 'Meals & Client Entertainment',
        glCode: '6030',
        glAccountName: 'Business Meals & Hospitality',
        taxTreatment: TaxTreatment.ITC_INELIGIBLE, // Food & beverages blocked ITC u/s 17(5)(b)
      },
      {
        categoryId: 'cat-lab-supplies',
        categoryName: 'Lab Reagents & Supplies',
        glCode: '5010',
        glAccountName: 'Direct Scientific Consumables',
        taxTreatment: TaxTreatment.ITC_ELIGIBLE,
      },
      {
        categoryId: 'cat-software-lic',
        categoryName: 'Software & SaaS Licenses',
        glCode: '6050',
        glAccountName: 'Cloud Infrastructure & Software',
        taxTreatment: TaxTreatment.RCM_APPLICABLE, // Overseas reverse charge if applicable
      },
    ];
    this.glMappings.set(tenant1, mappings);
  }

  private seedDefaultBudgets() {
    const tenant1 = '11111111-1111-1111-1111-111111111111';
    const budgets: BudgetDto[] = [
      {
        id: 'b-01',
        tenantId: tenant1,
        name: 'Q4 Research & Diagnostics Travel Budget',
        period: 'QUARTERLY',
        currency: 'INR',
        limitAmount: '250000.00',
        spentAmount: '78450.00',
        remainingAmount: '171550.00',
        utilizationPercent: 31.38,
        targetType: 'DEPARTMENT',
        targetId: 'dept-rnd-01',
        targetName: 'Research & Diagnostics',
      },
      {
        id: 'b-02',
        tenantId: tenant1,
        name: 'Annual Lab Equipment & Consumables Allocation',
        period: 'ANNUAL',
        currency: 'INR',
        limitAmount: '1500000.00',
        spentAmount: '432500.00',
        remainingAmount: '1067500.00',
        utilizationPercent: 28.83,
        targetType: 'CATEGORY',
        targetId: 'cat-lab-supplies',
        targetName: 'Lab Reagents & Supplies',
      },
    ];
    this.budgets.set(tenant1, budgets);
  }

  // --- GL Account Mappings ---

  getGLAccountMappings(tenantId: string): GLAccountMapping[] {
    return this.glMappings.get(tenantId) || [];
  }

  updateGLAccountMapping(
    tenantId: string,
    categoryId: string,
    input: UpdateGLAccountMappingInput
  ): GLAccountMapping {
    let list = this.glMappings.get(tenantId);
    if (!list) {
      list = [];
      this.glMappings.set(tenantId, list);
    }

    const index = list.findIndex((m) => m.categoryId === categoryId);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        glCode: input.glCode,
        glAccountName: input.glAccountName,
        taxTreatment: input.taxTreatment,
        defaultCostCenterId: input.defaultCostCenterId,
      };
      return list[index];
    } else {
      const created: GLAccountMapping = {
        categoryId,
        categoryName: 'Custom Category',
        glCode: input.glCode,
        glAccountName: input.glAccountName,
        taxTreatment: input.taxTreatment,
        defaultCostCenterId: input.defaultCostCenterId,
      };
      list.push(created);
      return created;
    }
  }

  // --- Finance Review Queue & Validation ---

  getReviewQueue(tenantId: string): ReportReviewItem[] {
    // Seed default review queue item if empty
    if (this.verificationRecords.size === 0) {
      const defaultItem: ReportReviewItem = {
        reportId: 'rep-001',
        tenantId,
        reportNumber: 'REP-2026-0891',
        title: 'Bangalore Lab Equipment & Reagents',
        employeeName: 'Dr. Rahul Sharma',
        totalAmount: '8450.00',
        reimbursableAmount: '8450.00',
        currency: 'INR',
        status: ReportStatus.APPROVED,
        submittedAt: '2026-10-18T10:30:00Z',
        approvedAt: '2026-10-18T14:20:00Z',
        documentationVerified: true,
        glAccountsVerified: true,
        taxTreatmentVerified: true,
        remarks: 'GST input tax credit validated against vendor GSTIN 29AABCI1234F1Z5.',
      };
      this.verificationRecords.set(defaultItem.reportId, defaultItem);
    }

    const results: ReportReviewItem[] = [];
    for (const item of this.verificationRecords.values()) {
      if (item.tenantId === tenantId) {
        results.push(item);
      }
    }
    return results;
  }

  validateReportForPayout(
    tenantId: string,
    reportId: string,
    input: FinanceValidationInput
  ): ReportReviewItem {
    let item = this.verificationRecords.get(reportId);
    if (!item) {
      item = {
        reportId,
        tenantId,
        reportNumber: `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Expense Report Under Review',
        employeeName: 'Employee',
        totalAmount: '0.00',
        reimbursableAmount: '0.00',
        currency: 'INR',
        status: ReportStatus.APPROVED,
        submittedAt: new Date().toISOString(),
        documentationVerified: input.documentationVerified,
        glAccountsVerified: input.glAccountsVerified,
        taxTreatmentVerified: input.taxTreatmentVerified,
        remarks: input.remarks,
      };
    } else {
      item.documentationVerified = input.documentationVerified;
      item.glAccountsVerified = input.glAccountsVerified;
      item.taxTreatmentVerified = input.taxTreatmentVerified;
      item.remarks = input.remarks;
    }

    this.verificationRecords.set(reportId, item);
    return item;
  }

  // --- Double-Entry Ledger Preview ---

  previewLedgerEffects(tenantId: string, report: { id: string; totalAmount: string; currency: string }) {
    const total = Money.from(report.totalAmount);
    // Estimated tax breakdown: 18% GST (9% CGST + 9% SGST)
    const base = total.div(1.18);
    const tax = total.sub(base);
    const halfTax = tax.div(2);

    return {
      reportId: report.id,
      currency: report.currency,
      totalAmount: total.toFixed(2),
      balanced: true,
      debits: [
        {
          accountCode: '5010',
          accountName: 'Direct Scientific Consumables / Travel Expense',
          amount: base.toFixed(2),
          type: 'EXPENSE',
        },
        {
          accountCode: '2110',
          accountName: 'Input Tax Credit - CGST (Receivable)',
          amount: halfTax.toFixed(2),
          type: 'CURRENT_ASSET',
        },
        {
          accountCode: '2111',
          accountName: 'Input Tax Credit - SGST (Receivable)',
          amount: halfTax.toFixed(2),
          type: 'CURRENT_ASSET',
        },
      ],
      credits: [
        {
          accountCode: '2010',
          accountName: 'Employee Reimbursement Payable / Accounts Payable',
          amount: total.toFixed(2),
          type: 'CURRENT_LIABILITY',
        },
      ],
    };
  }

  // --- Budgets ---

  getBudgets(tenantId: string): BudgetDto[] {
    return this.budgets.get(tenantId) || [];
  }

  createBudget(tenantId: string, input: CreateBudgetInput): BudgetDto {
    const list = this.budgets.get(tenantId) || [];
    const limit = Money.from(input.limitAmount);

    const newBudget: BudgetDto = {
      id: randomUUID(),
      tenantId,
      name: input.name,
      period: input.period,
      currency: input.currency,
      limitAmount: limit.toFixed(2),
      spentAmount: '0.00',
      remainingAmount: limit.toFixed(2),
      utilizationPercent: 0,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
    };

    list.push(newBudget);
    this.budgets.set(tenantId, list);
    return newBudget;
  }
}
