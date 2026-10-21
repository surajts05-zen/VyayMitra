import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeDto,
  OrgHierarchyNode,
} from '@vyay/contracts';
import { PrismaService } from '../prisma/prisma.service.js';

interface EmployeeRecord {
  id: string;
  tenantId: string;
  userId?: string | null;
  employeeNumber: string;
  displayName: string;
  email: string;
  departmentId?: string | null;
  managerId?: string | null;
  grade?: string | null;
  branch?: string | null;
  active: boolean;
  externalHrmId?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);
  private employees = new Map<string, EmployeeRecord>();

  constructor(private readonly prisma: PrismaService) {
    this.seedBaselineEmployees();
  }

  private seedBaselineEmployees() {
    const t1Id = '11111111-1111-1111-1111-111111111111';
    const t2Id = '22222222-2222-2222-2222-222222222222';

    // Tenant 1: Manager Anita Deshmukh
    const mgrId = 'emp-mgr-1111-1111-1111-111111111111';
    this.employees.set(mgrId, {
      id: mgrId,
      tenantId: t1Id,
      userId: 'cccc3333-3333-3333-3333-333333333333',
      employeeNumber: 'EMP-001',
      displayName: 'Anita Deshmukh',
      email: 'manager.anita@horizonsci.in',
      departmentId: 'dept-rd-1',
      managerId: null,
      grade: 'Director',
      branch: 'Bangalore Campus',
      active: true,
      externalHrmId: null, // Standalone mode
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-10-18T10:00:00.000Z',
    });

    // Tenant 1: Employee Dr. Rahul Sharma (reports to Anita)
    const empId = 'emp-rahul-2222-2222-2222-222222222222';
    this.employees.set(empId, {
      id: empId,
      tenantId: t1Id,
      userId: 'dddd4444-4444-4444-4444-444444444444',
      employeeNumber: 'EMP-104',
      displayName: 'Dr. Rahul Sharma',
      email: 'rahul.sharma@horizonsci.in',
      departmentId: 'dept-rd-1',
      managerId: mgrId,
      grade: 'Principal Scientist',
      branch: 'Bangalore Campus',
      active: true,
      externalHrmId: null,
      createdAt: '2026-04-05T00:00:00.000Z',
      updatedAt: '2026-10-18T10:00:00.000Z',
    });

    // Tenant 2: Employee John Doe (Tenant 2)
    const t2EmpId = 'emp-t2-9999-9999-9999-999999999999';
    this.employees.set(t2EmpId, {
      id: t2EmpId,
      tenantId: t2Id,
      userId: 'eeee5555-5555-5555-5555-555555555555',
      employeeNumber: 'BS-001',
      displayName: 'John Doe',
      email: 'john.bluesky@blueskyretail.com',
      departmentId: null,
      managerId: null,
      grade: 'Store Manager',
      branch: 'Mumbai Central',
      active: true,
      externalHrmId: null,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-10-18T10:00:00.000Z',
    });
  }

  async list(tenantId: string, activeOnly: boolean = false): Promise<EmployeeDto[]> {
    const results: EmployeeDto[] = [];
    for (const emp of this.employees.values()) {
      if (emp.tenantId === tenantId) {
        if (activeOnly && !emp.active) continue;
        const manager = emp.managerId ? this.employees.get(emp.managerId) : null;
        results.push({
          ...emp,
          managerName: manager ? manager.displayName : null,
          departmentName: emp.departmentId ? 'Department' : null,
        });
      }
    }
    return results;
  }

  async findById(tenantId: string, id: string): Promise<EmployeeDto> {
    const emp = this.employees.get(id);
    if (!emp || emp.tenantId !== tenantId) {
      throw new NotFoundException(`Employee with id ${id} not found in this organization`);
    }
    const manager = emp.managerId ? this.employees.get(emp.managerId) : null;
    return {
      ...emp,
      managerName: manager ? manager.displayName : null,
      departmentName: emp.departmentId ? 'Department' : null,
    };
  }

  async findByUserId(tenantId: string, userId: string): Promise<EmployeeDto | null> {
    for (const emp of this.employees.values()) {
      if (emp.tenantId === tenantId && emp.userId === userId) {
        const manager = emp.managerId ? this.employees.get(emp.managerId) : null;
        return {
          ...emp,
          managerName: manager ? manager.displayName : null,
          departmentName: emp.departmentId ? 'Department' : null,
        };
      }
    }
    return null;
  }

  async ensureEmployeeForUser(tenantId: string, userId: string, email: string, displayName?: string): Promise<EmployeeDto> {
    const existing = await this.findByUserId(tenantId, userId);
    if (existing) return existing;

    const id = `emp-${randomUUID()}`;
    const newEmp: EmployeeRecord = {
      id,
      tenantId,
      userId,
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      displayName: displayName || email.split('@')[0],
      email,
      departmentId: null,
      managerId: null,
      grade: 'Staff',
      branch: 'Main Office',
      active: true,
      externalHrmId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.employees.set(id, newEmp);
    return {
      ...newEmp,
      managerName: null,
      departmentName: null,
    };
  }

  async create(tenantId: string, input: CreateEmployeeInput): Promise<EmployeeDto> {
    // Check unique employee number within tenant
    for (const emp of this.employees.values()) {
      if (emp.tenantId === tenantId && emp.employeeNumber === input.employeeNumber) {
        throw new ConflictException(`Employee number '${input.employeeNumber}' is already in use`);
      }
    }

    // Validate managerId if provided
    if (input.managerId) {
      const manager = this.employees.get(input.managerId);
      if (!manager || manager.tenantId !== tenantId) {
        throw new BadRequestException('Specified manager does not exist in this organization');
      }
    }

    const id = randomUUID();
    const newEmp: EmployeeRecord = {
      id,
      tenantId,
      employeeNumber: input.employeeNumber,
      displayName: input.displayName,
      email: input.email,
      departmentId: input.departmentId ?? null,
      managerId: input.managerId ?? null,
      grade: input.grade ?? null,
      branch: input.branch ?? null,
      active: true,
      externalHrmId: input.externalHrmId ?? null, // Nullable HRM suite reference
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.employees.set(id, newEmp);

    if (this.prisma?.isConnected) {
      try {
        await this.prisma.employee.create({
          data: {
            id,
            tenantId,
            employeeNumber: input.employeeNumber,
            displayName: input.displayName,
            email: input.email,
            departmentId: input.departmentId ?? null,
            managerId: input.managerId ?? null,
            grade: input.grade ?? null,
            branch: input.branch ?? null,
            active: true,
            externalHrmId: input.externalHrmId ?? null,
          },
        });
      } catch (err) {
        this.logger.warn(`Prisma employee create warning: ${(err as Error).message}`);
      }
    }

    return this.findById(tenantId, id);
  }

  async update(tenantId: string, id: string, input: UpdateEmployeeInput): Promise<EmployeeDto> {
    const emp = await this.findById(tenantId, id);

    // Prevent circular reporting hierarchy
    if (input.managerId) {
      if (input.managerId === id) {
        throw new BadRequestException('An employee cannot be their own manager');
      }
      const manager = this.employees.get(input.managerId);
      if (!manager || manager.tenantId !== tenantId) {
        throw new BadRequestException('Specified manager does not exist in this organization');
      }
      // Check reporting chain for cycles
      let curr = manager.managerId;
      while (curr) {
        if (curr === id) {
          throw new BadRequestException('Circular manager hierarchy detected');
        }
        const next = this.employees.get(curr);
        curr = next?.managerId || null;
      }
    }

    const updated: EmployeeRecord = {
      ...emp,
      displayName: input.displayName ?? emp.displayName,
      departmentId: input.departmentId !== undefined ? input.departmentId : emp.departmentId,
      managerId: input.managerId !== undefined ? input.managerId : emp.managerId,
      grade: input.grade !== undefined ? input.grade : emp.grade,
      branch: input.branch !== undefined ? input.branch : emp.branch,
      active: input.active !== undefined ? input.active : emp.active,
      externalHrmId: input.externalHrmId !== undefined ? input.externalHrmId : emp.externalHrmId,
      updatedAt: new Date().toISOString(),
    };

    this.employees.set(id, updated);

    if (this.prisma?.isConnected) {
      try {
        await this.prisma.employee.update({
          where: { id },
          data: {
            displayName: updated.displayName,
            departmentId: updated.departmentId,
            managerId: updated.managerId,
            grade: updated.grade,
            branch: updated.branch,
            active: updated.active,
            externalHrmId: updated.externalHrmId,
          },
        });
      } catch (err) {
        this.logger.warn(`Prisma employee update warning: ${(err as Error).message}`);
      }
    }

    return this.findById(tenantId, id);
  }

  async softDeactivate(tenantId: string, id: string): Promise<EmployeeDto> {
    return this.update(tenantId, id, { active: false });
  }

  /**
   * Recursive tree traversal to build manager subordinate hierarchy
   */
  async getHierarchyTree(tenantId: string): Promise<OrgHierarchyNode[]> {
    const all = await this.list(tenantId, true);
    const roots = all.filter((e) => !e.managerId);

    const buildNode = (emp: EmployeeDto): OrgHierarchyNode => {
      const subs = all.filter((e) => e.managerId === emp.id);
      return {
        id: emp.id,
        displayName: emp.displayName,
        employeeNumber: emp.employeeNumber,
        email: emp.email,
        grade: emp.grade,
        subordinates: subs.map(buildNode),
      };
    };

    return roots.map(buildNode);
  }
}
