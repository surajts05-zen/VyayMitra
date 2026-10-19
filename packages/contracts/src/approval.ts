import { z } from 'zod';
import { ApprovalDecision } from './enums.js';

export const ApprovalDecisionSchema = z.object({
  decision: z.nativeEnum(ApprovalDecision),
  comment: z.string().max(1000).optional(),
  delegateId: z.string().uuid().optional(),
});
export type ApprovalDecisionInput = z.infer<typeof ApprovalDecisionSchema>;

export const ApprovalStepDtoSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  sequence: z.number().int(),
  stepName: z.string(),
  approverId: z.string().uuid(),
  approverName: z.string(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'DELEGATED']),
  decidedAt: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  delegatedFrom: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type ApprovalStepDto = z.infer<typeof ApprovalStepDtoSchema>;

export const CreateDelegationSchema = z.object({
  delegateUserId: z.string().uuid(),
  scope: z.enum(['ALL', 'DEPARTMENT', 'AMOUNT_LIMIT']).default('ALL'),
  amountLimit: z.string().optional(),
  effectiveFrom: z.string().datetime(),
  effectiveUntil: z.string().datetime(),
  reason: z.string().max(500).optional(),
});
export type CreateDelegationInput = z.infer<typeof CreateDelegationSchema>;

export const DelegationDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  delegatorUserId: z.string().uuid(),
  delegatorName: z.string(),
  delegateUserId: z.string().uuid(),
  delegateName: z.string(),
  scope: z.enum(['ALL', 'DEPARTMENT', 'AMOUNT_LIMIT']),
  amountLimit: z.string().nullable().optional(),
  effectiveFrom: z.string(),
  effectiveUntil: z.string(),
  active: z.boolean(),
  reason: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type DelegationDto = z.infer<typeof DelegationDtoSchema>;
