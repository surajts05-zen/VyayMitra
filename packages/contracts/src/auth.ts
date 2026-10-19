import { z } from 'zod';
import { Role } from './enums.js';

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyName: z.string().min(2).max(100).optional(),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantId: z.string().uuid().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  employeeNumber: z.string().min(1).max(50).optional(),
  displayName: z.string().min(1).max(100).optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;

export const AuthTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  membershipId: z.string().uuid(),
  role: z.nativeEnum(Role),
  email: z.string().email(),
});
export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  tenant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    role: z.nativeEnum(Role),
  }),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
