import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import {
  PlatformTenantSummaryDto,
  PlatformUserSummaryDto,
  PlatformResetPasswordInput,
  PlatformResetPasswordResultDto,
  CreateTenantAdminInput,
  UpdateTenantStatusInput,
  PlatformAuditLogDto,
  PlatformStatsDto,
} from '@vyay/contracts';
import { AuthService } from '../auth/auth.service.js';
import { TokenService } from '../auth/token.service.js';

@Injectable()
export class PlatformService {
  private auditLogs: PlatformAuditLogDto[] = [
    {
      id: 'audit-init-0',
      action: 'TENANT_CREATED',
      actorEmail: 'superadmin@vyaymitra.internal',
      targetTenantId: '11111111-1111-1111-1111-111111111111',
      targetTenantName: 'Horizon Scientific India Ltd',
      reason: 'Initial platform baseline seed',
      timestamp: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'audit-init-1',
      action: 'TENANT_CREATED',
      actorEmail: 'superadmin@vyaymitra.internal',
      targetTenantId: '22222222-2222-2222-2222-222222222222',
      targetTenantName: 'BlueSky Retail Pvt Ltd',
      reason: 'Initial platform baseline seed',
      timestamp: '2026-05-01T00:00:00.000Z',
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  getStats(): PlatformStatsDto {
    const tenants = this.authService.listAllTenants().filter((t) => t.id !== '00000000-0000-0000-0000-000000000000');
    const users = this.authService.listAllUsers().filter((u) => u.email !== 'superadmin@vyaymitra.internal');
    const active = tenants.filter((t) => t.status !== 'SUSPENDED');
    const suspended = tenants.filter((t) => t.status === 'SUSPENDED');

    return {
      totalTenants: tenants.length,
      activeTenants: active.length,
      suspendedTenants: suspended.length,
      totalUsers: users.length,
      systemStatus: 'OPERATIONAL',
      version: '1.0.0-m7',
    };
  }

  listTenants(): PlatformTenantSummaryDto[] {
    const tenants = this.authService.listAllTenants().filter((t) => t.id !== '00000000-0000-0000-0000-000000000000');
    const memberships = this.authService.listAllMemberships();

    return tenants.map((t) => {
      const tenantMembers = memberships.filter((m) => m.tenantId === t.id && m.active);
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        baseCurrency: t.baseCurrency,
        country: t.country,
        timezone: t.timezone,
        fiscalYearStartMonth: t.fiscalYearStartMonth,
        plan: t.plan || 'GROWTH',
        status: t.status || 'ACTIVE',
        userCount: tenantMembers.length,
        expenseCount: 14, // seed estimate
        createdAt: t.createdAt || '2026-04-01T00:00:00.000Z',
        updatedAt: t.updatedAt || '2026-10-18T12:00:00.000Z',
      };
    });
  }

  getTenant(tenantId: string): PlatformTenantSummaryDto {
    const tenant = this.authService.getTenant(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }
    const members = this.authService.listTenantMemberships(tenantId);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      baseCurrency: tenant.baseCurrency,
      country: tenant.country,
      timezone: tenant.timezone,
      fiscalYearStartMonth: tenant.fiscalYearStartMonth,
      plan: tenant.plan || 'GROWTH',
      status: tenant.status || 'ACTIVE',
      userCount: members.length,
      expenseCount: 14,
      createdAt: tenant.createdAt || '2026-04-01T00:00:00.000Z',
      updatedAt: tenant.updatedAt || '2026-10-18T12:00:00.000Z',
    };
  }

  updateTenant(
    tenantId: string,
    input: UpdateTenantStatusInput,
    actorEmail: string
  ): PlatformTenantSummaryDto {
    const current = this.authService.getTenant(tenantId);
    if (!current) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const updated = this.authService.updateTenant(tenantId, {
      status: input.status ?? current.status,
      plan: input.plan ?? current.plan,
      name: input.name ?? current.name,
    });

    if (input.status && input.status !== current.status) {
      this.recordAudit({
        action: 'TENANT_STATUS_UPDATED',
        actorEmail,
        targetTenantId: tenantId,
        targetTenantName: current.name,
        reason: `Tenant status changed from ${current.status || 'ACTIVE'} to ${input.status}`,
      });
    }

    if (input.plan && input.plan !== current.plan) {
      this.recordAudit({
        action: 'TENANT_PLAN_CHANGED',
        actorEmail,
        targetTenantId: tenantId,
        targetTenantName: current.name,
        reason: `Subscription plan changed from ${current.plan || 'GROWTH'} to ${input.plan}`,
      });
    }

    return this.getTenant(tenantId);
  }

  createTenant(input: CreateTenantAdminInput, actorEmail: string): PlatformTenantSummaryDto {
    const tenantId = randomUUID();
    const adminUserId = randomUUID();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(input.initialPassword, salt);

    const { tenant } = this.authService.createTenantWithAdmin({
      id: tenantId,
      name: input.name,
      slug: input.slug,
      baseCurrency: input.baseCurrency,
      country: input.country,
      timezone: input.timezone,
      fiscalYearStartMonth: input.fiscalYearStartMonth,
      plan: input.plan,
      status: 'ACTIVE',
      adminUserId,
      adminEmail: input.adminEmail,
      adminPasswordHash: passwordHash,
      adminFirstName: input.adminFirstName,
      adminLastName: input.adminLastName,
    });

    this.recordAudit({
      action: 'TENANT_CREATED',
      actorEmail,
      targetTenantId: tenant.id,
      targetTenantName: tenant.name,
      targetUserId: adminUserId,
      targetUserEmail: input.adminEmail,
      reason: `Tenant provisioned with owner ${input.adminEmail}`,
    });

    return this.getTenant(tenant.id);
  }

  listTenantUsers(tenantId: string): PlatformUserSummaryDto[] {
    const tenant = this.authService.getTenant(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const memberships = this.authService.listTenantMemberships(tenantId);
    return memberships.map((m) => {
      const user = this.authService.getUser(m.userId);
      return {
        id: m.userId,
        email: user?.email || 'unknown@user.local',
        firstName: user?.firstName || 'User',
        lastName: user?.lastName || '',
        role: m.role,
        active: m.active,
        tenantId,
        createdAt: '2026-04-01T00:00:00.000Z',
      };
    });
  }

  async resetUserPassword(
    tenantId: string,
    userId: string,
    input: PlatformResetPasswordInput,
    actorEmail: string
  ): Promise<PlatformResetPasswordResultDto> {
    const tenant = this.authService.getTenant(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    const user = this.authService.getUser(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify user actually belongs to this tenant
    const memberships = this.authService.listTenantMemberships(tenantId);
    const membership = memberships.find((m) => m.userId === userId);
    if (!membership) {
      throw new BadRequestException(`User ${userId} does not belong to tenant ${tenantId}`);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(input.newPassword, salt);

    // Update the user's password in storage
    const updated = this.authService.updateUserPassword(userId, newHash);
    if (!updated) {
      throw new BadRequestException('Failed to update password for user');
    }

    // Immediately revoke all existing sessions if requested (default true)
    if (input.revokeExistingSessions !== false) {
      this.tokenService.revokeUserSessions(userId);
    }

    // Record immutable audit log
    const auditRecord = this.recordAudit({
      action: 'USER_PASSWORD_RESET',
      actorEmail,
      targetTenantId: tenantId,
      targetTenantName: tenant.name,
      targetUserId: userId,
      targetUserEmail: user.email,
      reason: input.reason,
    });

    return {
      success: true,
      userId,
      email: user.email,
      resetAt: auditRecord.timestamp,
      sessionsRevoked: input.revokeExistingSessions !== false,
      auditLogId: auditRecord.id,
      message: `Password reset successfully for ${user.email}. Previous sessions were invalidated.`,
    };
  }

  listAuditLogs(): PlatformAuditLogDto[] {
    return [...this.auditLogs].reverse();
  }

  private recordAudit(params: {
    action: PlatformAuditLogDto['action'];
    actorEmail: string;
    targetTenantId: string;
    targetTenantName: string;
    targetUserId?: string;
    targetUserEmail?: string;
    reason: string;
  }): PlatformAuditLogDto {
    const entry: PlatformAuditLogDto = {
      id: `audit-${randomUUID()}`,
      action: params.action,
      actorEmail: params.actorEmail,
      targetTenantId: params.targetTenantId,
      targetTenantName: params.targetTenantName,
      targetUserId: params.targetUserId,
      targetUserEmail: params.targetUserEmail,
      reason: params.reason,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.push(entry);
    return entry;
  }
}
