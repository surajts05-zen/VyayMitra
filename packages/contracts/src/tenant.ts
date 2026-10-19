import { z } from 'zod';
import { Role } from './enums.js';

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  baseCurrency: z.string().length(3).default('INR'),
  country: z.string().length(2).default('IN'),
  timezone: z.string().default('Asia/Kolkata'),
  fiscalYearStartMonth: z.number().int().min(1).max(12).default(4), // April in India
  logoUrl: z.string().url().optional(),
});
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  baseCurrency: z.string().length(3).optional(),
  country: z.string().length(2).optional(),
  timezone: z.string().optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  logoUrl: z.string().url().nullable().optional(),
});
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

export const TenantDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  baseCurrency: z.string(),
  country: z.string(),
  timezone: z.string(),
  fiscalYearStartMonth: z.number(),
  logoUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantDto = z.infer<typeof TenantDtoSchema>;

export const MembershipDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  userName: z.string(),
  role: z.nativeEnum(Role),
  active: z.boolean(),
  createdAt: z.string(),
});
export type MembershipDto = z.infer<typeof MembershipDtoSchema>;
