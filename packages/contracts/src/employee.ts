import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  employeeNumber: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  grade: z.string().max(50).optional(),
  branch: z.string().max(100).optional(),
  externalHrmId: z.string().max(100).optional(), // Optional/Nullable for KaaryaMitra HRM suite sync
});
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  departmentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
  grade: z.string().max(50).nullable().optional(),
  branch: z.string().max(100).nullable().optional(),
  active: z.boolean().optional(),
  externalHrmId: z.string().max(100).nullable().optional(),
});
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const EmployeeDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  employeeNumber: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  departmentId: z.string().uuid().nullable().optional(),
  departmentName: z.string().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  managerName: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  active: z.boolean(),
  externalHrmId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type EmployeeDto = z.infer<typeof EmployeeDtoSchema>;

export const OrgHierarchyNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    displayName: z.string(),
    employeeNumber: z.string(),
    email: z.string(),
    grade: z.string().nullable().optional(),
    subordinates: z.array(OrgHierarchyNodeSchema),
  })
);
export type OrgHierarchyNode = z.infer<typeof OrgHierarchyNodeSchema>;

// Department
export const CreateDepartmentSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const DepartmentDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DepartmentDto = z.infer<typeof DepartmentDtoSchema>;

// Cost Center
export const CreateCostCenterSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});
export type CreateCostCenterInput = z.infer<typeof CreateCostCenterSchema>;

export const CostCenterDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CostCenterDto = z.infer<typeof CostCenterDtoSchema>;

// Project
export const CreateProjectSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const ProjectDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectDto = z.infer<typeof ProjectDtoSchema>;

// Category
export const CreateCategorySchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  accountMapping: z.string().max(100).optional(),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const CategoryDtoSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  accountMapping: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
