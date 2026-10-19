import { z } from 'zod';
import { PaymentMethod, ReimbursementStatus, ReportStatus } from './enums.js';

export const RecordPaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Amount must be a positive decimal number'),
  paidAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  transactionRef: z.string().min(3).max(100),
  payerBankAccount: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const ReimbursementPaymentDtoSchema = z.object({
  id: z.string().uuid(),
  reimbursementId: z.string().uuid(),
  amount: z.string(),
  paidAt: z.string(),
  method: z.nativeEnum(PaymentMethod),
  transactionRef: z.string(),
  payerBankAccount: z.string().nullable().optional(),
  recordedBy: z.string().uuid(),
  recordedByName: z.string().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type ReimbursementPaymentDto = z.infer<typeof ReimbursementPaymentDtoSchema>;

export const ReimbursementDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  reportId: z.string().uuid(),
  reportTitle: z.string().optional(),
  reportNumber: z.string().optional(),
  employeeId: z.string().uuid(),
  employeeName: z.string().optional(),
  currency: z.string().default('INR'),
  eligibleAmount: z.string(),
  paidAmount: z.string(),
  remainingAmount: z.string(),
  status: z.nativeEnum(ReimbursementStatus),
  payments: z.array(ReimbursementPaymentDtoSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ReimbursementDto = z.infer<typeof ReimbursementDtoSchema>;

export const ReimbursementFilterQuerySchema = z.object({
  status: z.nativeEnum(ReimbursementStatus).optional(),
  employeeId: z.string().uuid().optional(),
  reportId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ReimbursementFilterQuery = z.infer<typeof ReimbursementFilterQuerySchema>;

// --- Finance Review, GL Account Mapping & Budgets ---

export enum TaxTreatment {
  ITC_ELIGIBLE = 'ITC_ELIGIBLE',
  ITC_INELIGIBLE = 'ITC_INELIGIBLE',
  RCM_APPLICABLE = 'RCM_APPLICABLE',
  EXEMPT = 'EXEMPT',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
}

export const GLAccountMappingSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  glCode: z.string().min(2).max(50),
  glAccountName: z.string().min(2).max(100),
  taxTreatment: z.nativeEnum(TaxTreatment).default(TaxTreatment.ITC_ELIGIBLE),
  defaultCostCenterId: z.string().uuid().optional(),
});
export type GLAccountMapping = z.infer<typeof GLAccountMappingSchema>;

export const UpdateGLAccountMappingSchema = z.object({
  glCode: z.string().min(2).max(50),
  glAccountName: z.string().min(2).max(100),
  taxTreatment: z.nativeEnum(TaxTreatment).default(TaxTreatment.ITC_ELIGIBLE),
  defaultCostCenterId: z.string().uuid().optional(),
});
export type UpdateGLAccountMappingInput = z.infer<typeof UpdateGLAccountMappingSchema>;

export const FinanceValidationSchema = z.object({
  documentationVerified: z.boolean().default(true),
  taxTreatmentVerified: z.boolean().default(true),
  glAccountsVerified: z.boolean().default(true),
  remarks: z.string().max(500).optional(),
});
export type FinanceValidationInput = z.infer<typeof FinanceValidationSchema>;

export const BudgetDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  currency: z.string().default('INR'),
  limitAmount: z.string(),
  spentAmount: z.string(),
  remainingAmount: z.string(),
  utilizationPercent: z.number(),
  targetType: z.enum(['DEPARTMENT', 'PROJECT', 'CATEGORY']),
  targetId: z.string().uuid(),
  targetName: z.string(),
});
export type BudgetDto = z.infer<typeof BudgetDtoSchema>;

export const CreateBudgetSchema = z.object({
  name: z.string().min(2).max(100),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  limitAmount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  currency: z.string().default('INR'),
  targetType: z.enum(['DEPARTMENT', 'PROJECT', 'CATEGORY']),
  targetId: z.string().uuid(),
  targetName: z.string(),
});
export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
