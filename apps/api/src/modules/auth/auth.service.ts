import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import {
  Role,
  RegisterUserInput,
  LoginRequest,
  AuthResponse,
  InviteMemberInput,
  AcceptInviteInput,
} from '@vyay/contracts';
import { TokenService } from './token.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface InMemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

interface InMemoryTenant {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  country: string;
  timezone: string;
  fiscalYearStartMonth: number;
  plan?: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
  updatedAt?: string;
}

interface InMemoryMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: Role;
  active: boolean;
}

interface InMemoryInvite {
  token: string;
  tenantId: string;
  email: string;
  role: Role;
  employeeNumber?: string;
  displayName?: string;
  departmentId?: string;
  managerId?: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  // In-memory data store for standalone testing and dev resilience
  private users = new Map<string, InMemoryUser>();
  private tenants = new Map<string, InMemoryTenant>();
  private memberships = new Map<string, InMemoryMembership>();
  private invites = new Map<string, InMemoryInvite>();

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService
  ) {
    this.seedBaselineDemoData();
  }

  private seedBaselineDemoData() {
    // Seed default tenant
    const t1Id = '11111111-1111-1111-1111-111111111111';
    const t2Id = '22222222-2222-2222-2222-222222222222';

    const tPlatformId = '00000000-0000-0000-0000-000000000000';

    this.tenants.set(tPlatformId, {
      id: tPlatformId,
      name: 'VyayMitra Platform Operations',
      slug: 'vyaymitra-platform',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-19T00:00:00.000Z',
    });

    this.tenants.set(t1Id, {
      id: t1Id,
      name: 'Horizon Scientific India Ltd',
      slug: 'horizon-scientific',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-10-18T12:00:00.000Z',
    });

    this.tenants.set(t2Id, {
      id: t2Id,
      name: 'BlueSky Retail Pvt Ltd',
      slug: 'bluesky-retail',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      plan: 'GROWTH',
      status: 'ACTIVE',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-10-18T12:00:00.000Z',
    });

    // Seed Demo Users with hashed password 'Password123!'
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Password123!', salt);

    // 0. Platform Super Admin (System Operator)
    const superAdminUser: InMemoryUser = {
      id: 'ffff0000-0000-0000-0000-000000000000',
      email: 'superadmin@vyaymitra.internal',
      passwordHash: hash,
      firstName: 'Platform',
      lastName: 'Super Admin',
    };
    this.users.set(superAdminUser.id, superAdminUser);
    const mSuperAdmin: InMemoryMembership = {
      id: 'mem-superadmin-0',
      tenantId: tPlatformId,
      userId: superAdminUser.id,
      role: Role.PLATFORM_SUPER_ADMIN,
      active: true,
    };
    this.memberships.set(mSuperAdmin.id, mSuperAdmin);

    // 1. Company Admin / Owner
    const adminUser: InMemoryUser = {
      id: 'aaaa1111-1111-1111-1111-111111111111',
      email: 'admin@horizonsci.in',
      passwordHash: hash,
      firstName: 'Vikram',
      lastName: 'Mehta',
    };
    this.users.set(adminUser.id, adminUser);
    const mAdmin: InMemoryMembership = {
      id: 'mem-admin-1',
      tenantId: t1Id,
      userId: adminUser.id,
      role: Role.COMPANY_OWNER,
      active: true,
    };
    this.memberships.set(mAdmin.id, mAdmin);

    // 1b. Company Admin
    const compAdminUser: InMemoryUser = {
      id: 'aaaa2222-1111-1111-1111-111111111111',
      email: 'compadmin@horizonsci.in',
      passwordHash: hash,
      firstName: 'Karan',
      lastName: 'Kapoor',
    };
    this.users.set(compAdminUser.id, compAdminUser);
    const mCompAdmin: InMemoryMembership = {
      id: 'mem-admin-2',
      tenantId: t1Id,
      userId: compAdminUser.id,
      role: Role.COMPANY_ADMIN,
      active: true,
    };
    this.memberships.set(mCompAdmin.id, mCompAdmin);

    // 2. Finance Operator
    const finUser: InMemoryUser = {
      id: 'bbbb2222-2222-2222-2222-222222222222',
      email: 'sarah.finance@horizonsci.in',
      passwordHash: hash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
    };
    this.users.set(finUser.id, finUser);
    const mFin: InMemoryMembership = {
      id: 'mem-fin-1',
      tenantId: t1Id,
      userId: finUser.id,
      role: Role.FINANCE_OPERATOR,
      active: true,
    };
    this.memberships.set(mFin.id, mFin);

    // 3. Manager
    const mgrUser: InMemoryUser = {
      id: 'cccc3333-3333-3333-3333-333333333333',
      email: 'manager.anita@horizonsci.in',
      passwordHash: hash,
      firstName: 'Anita',
      lastName: 'Deshmukh',
    };
    this.users.set(mgrUser.id, mgrUser);
    const mMgr: InMemoryMembership = {
      id: 'mem-mgr-1',
      tenantId: t1Id,
      userId: mgrUser.id,
      role: Role.MANAGER,
      active: true,
    };
    this.memberships.set(mMgr.id, mMgr);

    // 4. Employee (Dr. Rahul Sharma)
    const empUser: InMemoryUser = {
      id: 'dddd4444-4444-4444-4444-444444444444',
      email: 'rahul.sharma@horizonsci.in',
      passwordHash: hash,
      firstName: 'Rahul',
      lastName: 'Sharma',
    };
    this.users.set(empUser.id, empUser);
    const mEmp: InMemoryMembership = {
      id: 'mem-emp-1',
      tenantId: t1Id,
      userId: empUser.id,
      role: Role.EMPLOYEE,
      active: true,
    };
    this.memberships.set(mEmp.id, mEmp);

    // 4b. Revocable Employee (for session/membership revocation tests)
    const revUser: InMemoryUser = {
      id: 'dddd4444-4444-4444-4444-444444444449',
      email: 'temp.revoked@horizonsci.in',
      passwordHash: hash,
      firstName: 'Temp',
      lastName: 'Revoked',
    };
    this.users.set(revUser.id, revUser);
    const mRev: InMemoryMembership = {
      id: 'mem-revoked-1',
      tenantId: t1Id,
      userId: revUser.id,
      role: Role.EMPLOYEE,
      active: true,
    };
    this.memberships.set(mRev.id, mRev);

    // 5. Tenant 2 Employee (for negative cross-tenant testing)
    const t2User: InMemoryUser = {
      id: 'eeee5555-5555-5555-5555-555555555555',
      email: 'john.bluesky@blueskyretail.com',
      passwordHash: hash,
      firstName: 'John',
      lastName: 'Doe',
    };
    this.users.set(t2User.id, t2User);
    const mT2: InMemoryMembership = {
      id: 'mem-t2-1',
      tenantId: t2Id,
      userId: t2User.id,
      role: Role.EMPLOYEE,
      active: true,
    };
    this.memberships.set(mT2.id, mT2);

    // 5b. Tenant 2 Company Owner (for cross-tenant admin isolation testing)
    const t2OwnerUser: InMemoryUser = {
      id: 'eeee6666-5555-5555-5555-555555555555',
      email: 'owner.bluesky@blueskyretail.com',
      passwordHash: hash,
      firstName: 'Robert',
      lastName: 'Chen',
    };
    this.users.set(t2OwnerUser.id, t2OwnerUser);
    const mT2Owner: InMemoryMembership = {
      id: 'mem-t2-2',
      tenantId: t2Id,
      userId: t2OwnerUser.id,
      role: Role.COMPANY_OWNER,
      active: true,
    };
    this.memberships.set(mT2Owner.id, mT2Owner);
  }

  async register(input: RegisterUserInput): Promise<AuthResponse> {
    const existing = Array.from(this.users.values()).find((u) => u.email === input.email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const userId = randomUUID();
    const tenantId = randomUUID();
    const membershipId = randomUUID();

    const companyName = input.companyName || `${input.firstName}'s Company`;
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const newUser: InMemoryUser = {
      id: userId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    };
    this.users.set(userId, newUser);

    const newTenant: InMemoryTenant = {
      id: tenantId,
      name: companyName,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
    };
    this.tenants.set(tenantId, newTenant);

    const newMembership: InMemoryMembership = {
      id: membershipId,
      tenantId,
      userId,
      role: Role.COMPANY_OWNER,
      active: true,
    };
    this.memberships.set(membershipId, newMembership);

    const tokens = this.tokenService.generateTokens({
      userId,
      tenantId,
      membershipId,
      role: Role.COMPANY_OWNER,
      email: input.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: userId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      tenant: {
        id: tenantId,
        name: newTenant.name,
        slug: newTenant.slug,
        role: Role.COMPANY_OWNER,
      },
    };
  }

  async login(input: LoginRequest): Promise<AuthResponse> {
    const user = Array.from(this.users.values()).find((u) => u.email === input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Resolve tenant membership
    let membership = Array.from(this.memberships.values()).find(
      (m) => m.userId === user.id && m.active && (!input.tenantId || m.tenantId === input.tenantId)
    );

    if (!membership) {
      throw new UnauthorizedException('No active membership found for this account and tenant');
    }

    if (this.tokenService.isMembershipRevoked(membership.id)) {
      throw new UnauthorizedException('This membership has been revoked by tenant administrator');
    }

    const tenant = this.tenants.get(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      tenantId: tenant.id,
      membershipId: membership.id,
      role: membership.role,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: membership.role,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const decoded = this.tokenService.verifyRefreshToken(refreshToken);
    const user = this.users.get(decoded.userId);
    const membership = this.memberships.get(decoded.membershipId);

    if (!user || !membership || !membership.active) {
      throw new UnauthorizedException('User or membership no longer active');
    }

    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      tenantId: membership.tenantId,
      membershipId: membership.id,
      role: membership.role,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async inviteMember(
    tenantId: string,
    inviterRole: Role,
    input: InviteMemberInput
  ): Promise<{ inviteToken: string; inviteUrl: string }> {
    // Role check: Only Owner and Admin can invite members
    if (inviterRole !== Role.COMPANY_OWNER && inviterRole !== Role.COMPANY_ADMIN) {
      throw new ForbiddenException('Only Company Owner or Admin can invite members');
    }

    // Role escalation prevention: Nobody can invite Platform Super Admin to a tenant
    if (input.role === Role.PLATFORM_SUPER_ADMIN) {
      throw new BadRequestException('Platform Super Admin cannot be invited to an organization tenant');
    }

    // Role escalation prevention: Admin cannot invite Owner
    if (inviterRole === Role.COMPANY_ADMIN && input.role === Role.COMPANY_OWNER) {
      throw new ForbiddenException('Company Admin cannot invite or assign Company Owner role');
    }

    const inviteToken = `inv_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    this.invites.set(inviteToken, {
      token: inviteToken,
      tenantId,
      email: input.email,
      role: input.role,
      employeeNumber: input.employeeNumber,
      displayName: input.displayName,
      departmentId: input.departmentId,
      managerId: input.managerId,
      expiresAt,
    });

    return {
      inviteToken,
      inviteUrl: `/accept-invite?token=${inviteToken}`,
    };
  }

  async acceptInvite(input: AcceptInviteInput): Promise<AuthResponse> {
    const invite = this.invites.get(input.token);
    if (!invite || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    let user = Array.from(this.users.values()).find((u) => u.email === invite.email);
    let userId = user?.id;

    if (!user) {
      if (!input.password) {
        throw new UnauthorizedException('Password required for new user registration');
      }
      userId = randomUUID();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      user = {
        id: userId,
        email: invite.email,
        passwordHash,
        firstName: input.firstName || invite.displayName?.split(' ')[0] || 'Employee',
        lastName: input.lastName || invite.displayName?.split(' ')[1] || 'User',
      };
      this.users.set(userId, user);
    }

    const membershipId = randomUUID();
    const newMembership: InMemoryMembership = {
      id: membershipId,
      tenantId: invite.tenantId,
      userId: userId!,
      role: invite.role,
      active: true,
    };
    this.memberships.set(membershipId, newMembership);
    this.invites.delete(input.token);

    const tenant = this.tenants.get(invite.tenantId)!;
    const tokens = this.tokenService.generateTokens({
      userId: user.id,
      tenantId: tenant.id,
      membershipId: newMembership.id,
      role: newMembership.role,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: newMembership.role,
      },
    };
  }

  async removeMembership(
    tenantId: string,
    membershipId: string,
    actorRole: Role
  ): Promise<{ success: boolean }> {
    if (actorRole !== Role.COMPANY_OWNER && actorRole !== Role.COMPANY_ADMIN) {
      throw new ForbiddenException('Only Company Owner or Admin can revoke memberships');
    }

    const membership = this.memberships.get(membershipId);
    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException('Membership not found in this organization');
    }

    if (membership.role === Role.COMPANY_OWNER && actorRole !== Role.COMPANY_OWNER) {
      throw new ForbiddenException('Cannot remove Company Owner membership');
    }

    membership.active = false;
    // Immediate session revocation
    this.tokenService.revokeMembership(membershipId);

    return { success: true };
  }

  getTenant(tenantId: string): InMemoryTenant | undefined {
    return this.tenants.get(tenantId);
  }

  getUser(userId: string): InMemoryUser | undefined {
    return this.users.get(userId);
  }

  // ─── Platform Administration Helpers ──────────────────────────────────────────

  listAllTenants(): InMemoryTenant[] {
    return Array.from(this.tenants.values());
  }

  listAllUsers(): InMemoryUser[] {
    return Array.from(this.users.values());
  }

  listAllMemberships(): InMemoryMembership[] {
    return Array.from(this.memberships.values());
  }

  listTenantMemberships(tenantId: string): InMemoryMembership[] {
    return Array.from(this.memberships.values()).filter(
      (m) => m.tenantId === tenantId && m.active
    );
  }

  updateUserPassword(userId: string, newPasswordHash: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    this.users.set(userId, user);
    return true;
  }

  updateTenant(tenantId: string, data: Partial<InMemoryTenant>): InMemoryTenant | undefined {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;
    const updated: InMemoryTenant = {
      ...tenant,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.tenants.set(tenantId, updated);
    return updated;
  }

  createTenantWithAdmin(input: {
    id: string;
    name: string;
    slug: string;
    baseCurrency: string;
    country: string;
    timezone: string;
    fiscalYearStartMonth: number;
    plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
    status: 'ACTIVE' | 'SUSPENDED';
    adminUserId: string;
    adminEmail: string;
    adminPasswordHash: string;
    adminFirstName: string;
    adminLastName: string;
  }): { tenant: InMemoryTenant; user: InMemoryUser; membership: InMemoryMembership } {
    if (this.tenants.has(input.id)) {
      throw new ConflictException('Tenant ID already exists');
    }
    const slugExists = Array.from(this.tenants.values()).some((t) => t.slug === input.slug);
    if (slugExists) {
      throw new ConflictException(`Tenant with slug "${input.slug}" already exists`);
    }

    const now = new Date().toISOString();
    const newTenant: InMemoryTenant = {
      id: input.id,
      name: input.name,
      slug: input.slug,
      baseCurrency: input.baseCurrency,
      country: input.country,
      timezone: input.timezone,
      fiscalYearStartMonth: input.fiscalYearStartMonth,
      plan: input.plan,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    this.tenants.set(newTenant.id, newTenant);

    const newUser: InMemoryUser = {
      id: input.adminUserId,
      email: input.adminEmail,
      passwordHash: input.adminPasswordHash,
      firstName: input.adminFirstName,
      lastName: input.adminLastName,
    };
    this.users.set(newUser.id, newUser);

    const membershipId = randomUUID();
    const newMembership: InMemoryMembership = {
      id: membershipId,
      tenantId: newTenant.id,
      userId: newUser.id,
      role: Role.COMPANY_OWNER,
      active: true,
    };
    this.memberships.set(membershipId, newMembership);

    return { tenant: newTenant, user: newUser, membership: newMembership };
  }
}
