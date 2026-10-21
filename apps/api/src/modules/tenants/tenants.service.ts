import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TenantDto, UpdateTenantInput, MembershipDto, Role } from '@vyay/contracts';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  country: string;
  timezone: string;
  fiscalYearStartMonth: number;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private tenantStore = new Map<string, TenantRecord>();
  private membershipsStore = new Map<string, Array<{ id: string; userId: string; role: Role; active: boolean }>>();

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {
    this.seedTenants();
  }

  private seedTenants() {
    const t1Id = '11111111-1111-1111-1111-111111111111';
    const t2Id = '22222222-2222-2222-2222-222222222222';

    this.tenantStore.set(t1Id, {
      id: t1Id,
      name: 'Horizon Scientific India Ltd',
      slug: 'horizon-scientific',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      logoUrl: null,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-10-18T12:00:00.000Z',
    });

    this.tenantStore.set(t2Id, {
      id: t2Id,
      name: 'BlueSky Retail Pvt Ltd',
      slug: 'bluesky-retail',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      logoUrl: null,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-10-18T12:00:00.000Z',
    });

    this.membershipsStore.set(t1Id, [
      { id: 'mem-admin-1', userId: 'aaaa1111-1111-1111-1111-111111111111', role: Role.COMPANY_OWNER, active: true },
      { id: 'mem-fin-1', userId: 'bbbb2222-2222-2222-2222-222222222222', role: Role.FINANCE_OPERATOR, active: true },
      { id: 'mem-mgr-1', userId: 'cccc3333-3333-3333-3333-333333333333', role: Role.MANAGER, active: true },
      { id: 'mem-emp-1', userId: 'dddd4444-4444-4444-4444-444444444444', role: Role.EMPLOYEE, active: true },
    ]);

    this.membershipsStore.set(t2Id, [
      { id: 'mem-t2-1', userId: 'eeee5555-5555-5555-5555-555555555555', role: Role.EMPLOYEE, active: true },
    ]);
  }

  async getTenant(tenantId: string): Promise<TenantDto> {
    let tenant = this.tenantStore.get(tenantId);
    if (!tenant && this.prisma?.isConnected) {
      try {
        const dbTenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
        });
        if (dbTenant) {
          tenant = {
            id: dbTenant.id,
            name: dbTenant.name,
            slug: dbTenant.slug,
            baseCurrency: dbTenant.baseCurrency,
            country: dbTenant.country,
            timezone: dbTenant.timezone,
            fiscalYearStartMonth: dbTenant.fiscalYearStartMonth,
            logoUrl: dbTenant.logoUrl,
            createdAt: dbTenant.createdAt.toISOString(),
            updatedAt: dbTenant.updatedAt.toISOString(),
          };
          this.tenantStore.set(tenantId, tenant);
        }
      } catch (err) {
        this.logger.warn(`Prisma tenant query error: ${(err as Error).message}`);
      }
    }
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${tenantId} not found`);
    }
    return tenant;
  }

  async updateTenant(tenantId: string, input: UpdateTenantInput): Promise<TenantDto> {
    const tenant = await this.getTenant(tenantId);
    const updated: TenantRecord = {
      ...tenant,
      name: input.name ?? tenant.name,
      baseCurrency: input.baseCurrency ?? tenant.baseCurrency,
      country: input.country ?? tenant.country,
      timezone: input.timezone ?? tenant.timezone,
      fiscalYearStartMonth: input.fiscalYearStartMonth ?? tenant.fiscalYearStartMonth,
      logoUrl: input.logoUrl !== undefined ? input.logoUrl : tenant.logoUrl,
      updatedAt: new Date().toISOString(),
    };
    this.tenantStore.set(tenantId, updated);
    if (this.prisma?.isConnected) {
      try {
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: {
            name: updated.name,
            baseCurrency: updated.baseCurrency,
            country: updated.country,
            timezone: updated.timezone,
            fiscalYearStartMonth: updated.fiscalYearStartMonth,
            logoUrl: updated.logoUrl,
          },
        });
      } catch (err) {
        this.logger.warn(`Prisma tenant update error: ${(err as Error).message}`);
      }
    }
    return updated;
  }

  async listMemberships(tenantId: string): Promise<MembershipDto[]> {
    const list = this.membershipsStore.get(tenantId) || [];
    return list
      .filter((m) => m.active)
      .map((m) => {
        const user = this.authService.getUser(m.userId);
        return {
          id: m.id,
          tenantId,
          userId: m.userId,
          userEmail: user?.email || 'unknown@domain.com',
          userName: user ? `${user.firstName} ${user.lastName}` : 'User',
          role: m.role,
          active: m.active,
          createdAt: new Date().toISOString(),
        };
      });
  }
}
