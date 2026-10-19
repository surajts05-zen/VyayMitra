import { Injectable, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DepartmentDto,
  CreateDepartmentInput,
  CostCenterDto,
  CreateCostCenterInput,
  ProjectDto,
  CreateProjectInput,
  CategoryDto,
  CreateCategoryInput,
} from '@vyay/contracts';

interface BaseOrgEntity {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryEntity extends BaseOrgEntity {
  accountMapping?: string | null;
}

@Injectable()
export class OrgService {
  private departments = new Map<string, BaseOrgEntity>();
  private costCenters = new Map<string, BaseOrgEntity>();
  private projects = new Map<string, BaseOrgEntity>();
  private categories = new Map<string, CategoryEntity>();

  constructor() {
    this.seedOrgData();
  }

  private seedOrgData() {
    const t1Id = '11111111-1111-1111-1111-111111111111';

    // Departments
    this.departments.set('dept-rd-1', {
      id: 'dept-rd-1',
      tenantId: t1Id,
      code: 'RD',
      name: 'Research & Development',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.departments.set('dept-field-1', {
      id: 'dept-field-1',
      tenantId: t1Id,
      code: 'OPS',
      name: 'Field Operations',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Cost Centers
    this.costCenters.set('cc-1', {
      id: 'cc-1',
      tenantId: t1Id,
      code: 'CC-BLR-01',
      name: 'Bangalore Lab Center',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Projects
    this.projects.set('proj-1', {
      id: 'proj-1',
      tenantId: t1Id,
      code: 'PROJ-OMEGA',
      name: 'Project Omega Enterprise',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Categories
    this.categories.set('cat-1', {
      id: 'cat-1',
      tenantId: t1Id,
      code: 'TRAVEL',
      name: 'Travel & Conveyance',
      accountMapping: '6010',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.categories.set('cat-2', {
      id: 'cat-2',
      tenantId: t1Id,
      code: 'LAB',
      name: 'Lab Consumables',
      accountMapping: '6020',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // --- Departments ---
  async listDepartments(tenantId: string): Promise<DepartmentDto[]> {
    return Array.from(this.departments.values()).filter((d) => d.tenantId === tenantId && d.active);
  }

  async createDepartment(tenantId: string, input: CreateDepartmentInput): Promise<DepartmentDto> {
    const existing = Array.from(this.departments.values()).find(
      (d) => d.tenantId === tenantId && d.code.toLowerCase() === input.code.toLowerCase()
    );
    if (existing) {
      throw new ConflictException(`Department with code '${input.code}' already exists`);
    }

    const id = randomUUID();
    const entity: BaseOrgEntity = {
      id,
      tenantId,
      code: input.code.toUpperCase(),
      name: input.name,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.departments.set(id, entity);
    return entity;
  }

  // --- Cost Centers ---
  async listCostCenters(tenantId: string): Promise<CostCenterDto[]> {
    return Array.from(this.costCenters.values()).filter((c) => c.tenantId === tenantId && c.active);
  }

  async createCostCenter(tenantId: string, input: CreateCostCenterInput): Promise<CostCenterDto> {
    const existing = Array.from(this.costCenters.values()).find(
      (c) => c.tenantId === tenantId && c.code.toLowerCase() === input.code.toLowerCase()
    );
    if (existing) {
      throw new ConflictException(`Cost Center with code '${input.code}' already exists`);
    }

    const id = randomUUID();
    const entity: BaseOrgEntity = {
      id,
      tenantId,
      code: input.code.toUpperCase(),
      name: input.name,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.costCenters.set(id, entity);
    return entity;
  }

  // --- Projects ---
  async listProjects(tenantId: string): Promise<ProjectDto[]> {
    return Array.from(this.projects.values()).filter((p) => p.tenantId === tenantId && p.active);
  }

  async createProject(tenantId: string, input: CreateProjectInput): Promise<ProjectDto> {
    const existing = Array.from(this.projects.values()).find(
      (p) => p.tenantId === tenantId && p.code.toLowerCase() === input.code.toLowerCase()
    );
    if (existing) {
      throw new ConflictException(`Project with code '${input.code}' already exists`);
    }

    const id = randomUUID();
    const entity: BaseOrgEntity = {
      id,
      tenantId,
      code: input.code.toUpperCase(),
      name: input.name,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, entity);
    return entity;
  }

  // --- Categories ---
  async listCategories(tenantId: string): Promise<CategoryDto[]> {
    return Array.from(this.categories.values()).filter((cat) => cat.tenantId === tenantId && cat.active);
  }

  async createCategory(tenantId: string, input: CreateCategoryInput): Promise<CategoryDto> {
    const existing = Array.from(this.categories.values()).find(
      (cat) => cat.tenantId === tenantId && cat.code.toLowerCase() === input.code.toLowerCase()
    );
    if (existing) {
      throw new ConflictException(`Category with code '${input.code}' already exists`);
    }

    const id = randomUUID();
    const entity: CategoryEntity = {
      id,
      tenantId,
      code: input.code.toUpperCase(),
      name: input.name,
      accountMapping: input.accountMapping || null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.categories.set(id, entity);
    return entity;
  }
}
