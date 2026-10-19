import { z } from 'zod';
import { Role } from './enums.js';

export type TenantSubscriptionPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantOperationalStatus = 'ACTIVE' | 'SUSPENDED';

export interface PlatformTenantSummaryDto {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  country: string;
  timezone: string;
  fiscalYearStartMonth: number;
  logoUrl?: string | null;
  plan: TenantSubscriptionPlan;
  status: TenantOperationalStatus;
  userCount: number;
  expenseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUserSummaryDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  tenantId: string;
  createdAt: string;
}

export const PlatformResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  reason: z.string().min(3, 'Audit reason is required (minimum 3 characters)'),
  temporary: z.boolean().default(true),
  revokeExistingSessions: z.boolean().default(true),
});

export type PlatformResetPasswordInput = z.infer<typeof PlatformResetPasswordSchema>;

export interface PlatformResetPasswordResultDto {
  success: boolean;
  userId: string;
  email: string;
  resetAt: string;
  sessionsRevoked: boolean;
  auditLogId: string;
  message: string;
}

export const CreateTenantAdminSchema = z.object({
  name: z.string().min(2, 'Tenant name required'),
  slug: z.string().min(2, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with dashes'),
  baseCurrency: z.string().length(3).default('INR'),
  country: z.string().length(2).default('IN'),
  timezone: z.string().default('Asia/Kolkata'),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(4),
  adminEmail: z.string().email('Valid admin email required'),
  adminFirstName: z.string().min(1, 'Admin first name required'),
  adminLastName: z.string().min(1, 'Admin last name required'),
  initialPassword: z.string().min(8, 'Initial password must be at least 8 characters'),
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']).default('GROWTH'),
});

export type CreateTenantAdminInput = z.infer<typeof CreateTenantAdminSchema>;

export const UpdateTenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
  name: z.string().min(2).optional(),
});

export type UpdateTenantStatusInput = z.infer<typeof UpdateTenantStatusSchema>;

export interface PlatformAuditLogDto {
  id: string;
  action: 'USER_PASSWORD_RESET' | 'TENANT_CREATED' | 'TENANT_STATUS_UPDATED' | 'TENANT_PLAN_CHANGED';
  actorEmail: string;
  targetTenantId: string;
  targetTenantName: string;
  targetUserId?: string;
  targetUserEmail?: string;
  reason: string;
  timestamp: string;
}

export interface PlatformStatsDto {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  systemStatus: 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE';
  version: string;
}
