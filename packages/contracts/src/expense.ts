import { z } from 'zod';
import { ExpenseStatus, PaymentSource } from './enums.js';

export const TaxComponentSchema = z.object({
  type: z.enum(['CGST', 'SGST', 'IGST', 'OTHER']),
  rate: z.string().regex(/^\d+(\.\d{1,4})?$/),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
});
export type TaxComponent = z.infer<typeof TaxComponentSchema>;

export const TaxMetadataSchema = z.object({
  gstin: z.string().nullable().optional(),
  taxInclusive: z.boolean().default(false),
  components: z.array(TaxComponentSchema).default([]),
  hsnSac: z.string().nullable().optional(),
  placeOfSupply: z.string().nullable().optional(),
});
export type TaxMetadata = z.infer<typeof TaxMetadataSchema>;

export const CreateExpenseLineSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  description: z.string().min(1).max(255),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  taxMetadata: TaxMetadataSchema.optional(),
});
export type CreateExpenseLineInput = z.infer<typeof CreateExpenseLineSchema>;

export const CreateExpenseSchema = z.object({
  merchant: z.string().min(1).max(255),
  invoiceNumber: z.string().max(100).optional(),
  spentAt: z.string().datetime(),
  currency: z.string().length(3).default('INR'),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
  subtotal: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
  categoryId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  paidBy: z.nativeEnum(PaymentSource).default(PaymentSource.EMPLOYEE_PERSONAL),
  reimbursable: z.boolean().default(true),
  billable: z.boolean().default(false),
  businessPurpose: z.string().min(1).max(1000),
  location: z.string().max(255).optional(),
  attendees: z.array(z.string()).optional(),
  taxMetadata: TaxMetadataSchema.optional(),
  receiptIds: z.array(z.string().uuid()).optional(),
  lines: z.array(CreateExpenseLineSchema).optional(),
});
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export const ExpenseDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  employeeId: z.string().uuid(),
  reportId: z.string().uuid().nullable().optional(),
  merchant: z.string(),
  invoiceNumber: z.string().nullable().optional(),
  spentAt: z.string(),
  currency: z.string(),
  amount: z.string(),
  baseAmount: z.string(),
  subtotal: z.string().nullable().optional(),
  taxAmount: z.string().nullable().optional(),
  categoryId: z.string().uuid(),
  paidBy: z.nativeEnum(PaymentSource),
  reimbursable: z.boolean(),
  billable: z.boolean(),
  businessPurpose: z.string(),
  status: z.nativeEnum(ExpenseStatus),
  duplicateWarning: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ExpenseDto = z.infer<typeof ExpenseDtoSchema>;

export const ExpenseLineDtoSchema = z.object({
  id: z.string().uuid(),
  expenseId: z.string().uuid(),
  amount: z.string(),
  description: z.string(),
  costCenterId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  taxMetadata: TaxMetadataSchema.optional(),
  createdAt: z.string(),
});
export type ExpenseLineDto = z.infer<typeof ExpenseLineDtoSchema>;

export const UpdateExpenseSchema = CreateExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

export const ExpenseFilterQuerySchema = z.object({
  status: z.nativeEnum(ExpenseStatus).optional(),
  categoryId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  reimbursable: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ExpenseFilterQuery = z.infer<typeof ExpenseFilterQuerySchema>;
