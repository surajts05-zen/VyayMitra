import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateDepartmentSchema,
  CreateDepartmentInput,
  CreateCostCenterSchema,
  CreateCostCenterInput,
  CreateProjectSchema,
  CreateProjectInput,
  CreateCategorySchema,
  CreateCategoryInput,
  Role,
} from '@vyay/contracts';
import { OrgService } from './org.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';

@ApiTags('Organization & Master Data')
@Controller('api/v1/org')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  // --- Departments ---
  @Get('departments')
  @ApiOperation({ summary: 'List departments for tenant' })
  @ApiResponse({ status: 200, description: 'Departments list' })
  async getDepartments(@TenantId() tenantId: string) {
    return this.orgService.listDepartments(tenantId);
  }

  @Post('departments')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  async createDepartment(
    @TenantId() tenantId: string,
    @Body() body: CreateDepartmentInput
  ) {
    const validated = CreateDepartmentSchema.parse(body);
    return this.orgService.createDepartment(tenantId, validated);
  }

  // --- Cost Centers ---
  @Get('cost-centers')
  @ApiOperation({ summary: 'List cost centers for tenant' })
  @ApiResponse({ status: 200, description: 'Cost centers list' })
  async getCostCenters(@TenantId() tenantId: string) {
    return this.orgService.listCostCenters(tenantId);
  }

  @Post('cost-centers')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create cost center' })
  @ApiResponse({ status: 201, description: 'Cost center created' })
  async createCostCenter(
    @TenantId() tenantId: string,
    @Body() body: CreateCostCenterInput
  ) {
    const validated = CreateCostCenterSchema.parse(body);
    return this.orgService.createCostCenter(tenantId, validated);
  }

  // --- Projects ---
  @Get('projects')
  @ApiOperation({ summary: 'List projects for tenant' })
  @ApiResponse({ status: 200, description: 'Projects list' })
  async getProjects(@TenantId() tenantId: string) {
    return this.orgService.listProjects(tenantId);
  }

  @Post('projects')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async createProject(
    @TenantId() tenantId: string,
    @Body() body: CreateProjectInput
  ) {
    const validated = CreateProjectSchema.parse(body);
    return this.orgService.createProject(tenantId, validated);
  }

  // --- Categories ---
  @Get('categories')
  @ApiOperation({ summary: 'List expense categories for tenant' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(@TenantId() tenantId: string) {
    return this.orgService.listCategories(tenantId);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN, Role.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create expense category with default GL mapping' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(
    @TenantId() tenantId: string,
    @Body() body: CreateCategoryInput
  ) {
    const validated = CreateCategorySchema.parse(body);
    return this.orgService.createCategory(tenantId, validated);
  }
}
