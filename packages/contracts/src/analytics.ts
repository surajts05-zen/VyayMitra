import { z } from 'zod';

// ─── API Credential Schemas ─────────────────────────────────────────────────

export enum ApiCredentialScope {
  EXPENSES_READ = 'expenses:read',
  EXPENSES_WRITE = 'expenses:write',
  REPORTS_READ = 'reports:read',
  REPORTS_WRITE = 'reports:write',
  FINANCE_READ = 'finance:read',
  FINANCE_WRITE = 'finance:write',
  ANALYTICS_READ = 'analytics:read',
  WEBHOOKS_MANAGE = 'webhooks:manage',
  ADMIN = 'admin',
}

export const CreateApiCredentialSchema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.nativeEnum(ApiCredentialScope)).min(1),
  description: z.string().max(250).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(), // null = no expiry
});
export type CreateApiCredentialInput = z.infer<typeof CreateApiCredentialSchema>;

export const ApiCredentialDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  clientId: z.string(),
  scopes: z.array(z.nativeEnum(ApiCredentialScope)),
  description: z.string().nullable().optional(),
  lastUsedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type ApiCredentialDto = z.infer<typeof ApiCredentialDtoSchema>;

export const ApiCredentialCreatedDtoSchema = ApiCredentialDtoSchema.extend({
  clientSecret: z.string(), // Only returned once at creation
});
export type ApiCredentialCreatedDto = z.infer<typeof ApiCredentialCreatedDtoSchema>;

// ─── Webhook Schemas ─────────────────────────────────────────────────────────

export enum WebhookEvent {
  EXPENSE_CREATED = 'expense.created',
  EXPENSE_SUBMITTED = 'expense.submitted',
  REPORT_SUBMITTED = 'report.submitted',
  REPORT_APPROVED = 'report.approved',
  REPORT_REJECTED = 'report.rejected',
  REPORT_FINALIZED = 'report.finalized',
  REIMBURSEMENT_ELIGIBLE = 'reimbursement.eligible',
  REIMBURSEMENT_PAID = 'reimbursement.paid',
  INTEGRATION_SYNCED = 'integration.synced',
  INTEGRATION_FAILED = 'integration.failed',
}

export const CreateWebhookSubscriptionSchema = z.object({
  url: z.string().url(),
  events: z.array(z.nativeEnum(WebhookEvent)).min(1),
  description: z.string().max(250).optional(),
  active: z.boolean().default(true),
});
export type CreateWebhookSubscriptionInput = z.infer<typeof CreateWebhookSubscriptionSchema>;

export const WebhookSubscriptionDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  url: z.string().url(),
  events: z.array(z.nativeEnum(WebhookEvent)),
  description: z.string().nullable().optional(),
  active: z.boolean(),
  signingKeyHint: z.string(), // last 4 chars of HMAC secret
  signingKey: z.string().optional(), // Full secret returned on creation or key rotation only
  successCount: z.number(),
  failureCount: z.number(),
  lastTriggeredAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type WebhookSubscriptionDto = z.infer<typeof WebhookSubscriptionDtoSchema>;

export const WebhookDeliveryLogDtoSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  event: z.nativeEnum(WebhookEvent),
  payload: z.record(z.unknown()),
  httpStatus: z.number().nullable().optional(),
  durationMs: z.number().nullable().optional(),
  attempts: z.number(),
  success: z.boolean(),
  error: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type WebhookDeliveryLogDto = z.infer<typeof WebhookDeliveryLogDtoSchema>;

// ─── Analytics Schemas ───────────────────────────────────────────────────────

export const AnalyticsFiltersSchema = z.object({
  fromDate: z.string().optional(), // ISO date
  toDate: z.string().optional(),
  currency: z.string().default('INR'),
  departmentId: z.string().optional(),
  categoryId: z.string().optional(),
});
export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>;

export const SpendDataPointSchema = z.object({
  label: z.string(),
  amount: z.string(),
  count: z.number(),
  currency: z.string(),
});
export type SpendDataPoint = z.infer<typeof SpendDataPointSchema>;

export const SpendByPeriodSchema = z.object({
  period: z.string(), // e.g. "2026-10", "Q4 2026"
  totalAmount: z.string(),
  reportCount: z.number(),
  expenseCount: z.number(),
  currency: z.string(),
});
export type SpendByPeriod = z.infer<typeof SpendByPeriodSchema>;

export const PolicyViolationSummarySchema = z.object({
  totalViolations: z.number(),
  warnViolations: z.number(),
  blockViolations: z.number(),
  escalateViolations: z.number(),
  topViolatedCategory: z.string().nullable(),
  violationRate: z.number(), // percentage of reports with ≥1 violation
});
export type PolicyViolationSummary = z.infer<typeof PolicyViolationSummarySchema>;

export const ReimbursementCycleSchema = z.object({
  averageDaysSubmitToApproval: z.number(),
  averageDaysApprovalToFinance: z.number(),
  averageDaysFinanceToDisbursement: z.number(),
  averageTotalCycleDays: z.number(),
  fastestCycleDays: z.number(),
  slowestCycleDays: z.number(),
});
export type ReimbursementCycle = z.infer<typeof ReimbursementCycleSchema>;

export const TenantAnalyticsSummarySchema = z.object({
  tenantId: z.string().uuid(),
  currency: z.string(),
  period: z.object({
    from: z.string(),
    to: z.string(),
  }),
  totalSpend: z.string(),
  totalReports: z.number(),
  totalExpenses: z.number(),
  pendingReports: z.number(),
  pendingAmount: z.string(),
  reimbursedAmount: z.string(),
  reimbursementPendingAmount: z.string(),
  spendByCategory: z.array(SpendDataPointSchema),
  spendByDepartment: z.array(SpendDataPointSchema),
  spendByMonth: z.array(SpendByPeriodSchema),
  policyViolations: PolicyViolationSummarySchema,
  reimbursementCycle: ReimbursementCycleSchema,
  topSpenders: z.array(
    z.object({
      employeeId: z.string(),
      employeeName: z.string(),
      totalAmount: z.string(),
      reportCount: z.number(),
    })
  ),
});
export type TenantAnalyticsSummary = z.infer<typeof TenantAnalyticsSummarySchema>;
