import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateEmployeeSchema,
  CreateEmployeeInput,
  UpdateEmployeeSchema,
  UpdateEmployeeInput,
  Role,
} from '@vyay/contracts';
import { EmployeesService } from './employees.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';

@ApiTags('Employees & Directory')
@Controller('api/v1/employees')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List employees in the organization' })
  @ApiResponse({ status: 200, description: 'List of employees' })
  async listEmployees(
    @TenantId() tenantId: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    return this.employeesService.list(tenantId, activeOnly === 'true');
  }

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get manager-subordinate reporting tree' })
  @ApiResponse({ status: 200, description: 'Reporting hierarchy tree' })
  async getHierarchyTree(@TenantId() tenantId: string) {
    return this.employeesService.getHierarchyTree(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee details by ID' })
  @ApiResponse({ status: 200, description: 'Employee record' })
  async getEmployee(
    @TenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.employeesService.findById(tenantId, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new employee record' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  async createEmployee(
    @TenantId() tenantId: string,
    @Body() body: CreateEmployeeInput
  ) {
    const validated = CreateEmployeeSchema.parse(body);
    return this.employeesService.create(tenantId, validated);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update an existing employee record' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  async updateEmployee(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateEmployeeInput
  ) {
    const validated = UpdateEmployeeSchema.parse(body);
    return this.employeesService.update(tenantId, id, validated);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Soft deactivate an employee (preserves finance history)' })
  @ApiResponse({ status: 200, description: 'Employee deactivated' })
  async deactivateEmployee(
    @TenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.employeesService.softDeactivate(tenantId, id);
  }
}
