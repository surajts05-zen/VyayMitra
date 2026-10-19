import { z } from 'zod';
import { ReportStatus, ReimbursementStatus } from './enums.js';

export const PolicyViolationDtoSchema = z.object({
  ruleType: z.string(),
  severity: z.enum(['WARN', 'BLOCK', 'ESCALATE']),
  message: z.string(),
  expenseId: z.string().uuid().optional(),
});
export type PolicyViolationDto = z.infer<typeof PolicyViolationDtoSchema>;

export const CreateReportSchema = z.object({
  title: z.string().min(2).max(255),
  businessPurpose: z.string().min(1).max(1000),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  location: z.string().max(255).optional(),
  expenseIds: z.array(z.string().uuid()).min(1),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const ReportDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  employeeId: z.string().uuid(),
  submittedByName: z.string().optional(),
  title: z.string(),
  businessPurpose: z.string(),
  status: z.nativeEnum(ReportStatus),
  reimbursementStatus: z.nativeEnum(ReimbursementStatus).default(ReimbursementStatus.NOT_READY),
  totalAmount: z.string(),
  reimbursableAmount: z.string(),
  currency: z.string(),
  expenseCount: z.number().int().default(1),
  policyViolations: z.array(PolicyViolationDtoSchema).default([]),
  submittedAt: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  finalizedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ReportDto = z.infer<typeof ReportDtoSchema>;

export const ReportFilterQuerySchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  employeeId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ReportFilterQuery = z.infer<typeof ReportFilterQuerySchema>;
