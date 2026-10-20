import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding VyayMitra PostgreSQL Production Database (vyaymitradb)...');

  // 1. Password Hash (Default testing password: Password@123)
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 2. Primary Tenant: Horizon Scientific India Ltd
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'horizon-scientific' },
    update: {
      name: 'Horizon Scientific India Ltd',
      status: 'ACTIVE',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
    },
    create: {
      id: 'aaaa0000-0000-0000-0000-000000000001',
      name: 'Horizon Scientific India Ltd',
      slug: 'horizon-scientific',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      status: 'ACTIVE',
    },
  });

  // Secondary Tenant for Cross-Tenant Negative Testing
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'bluesky-retail' },
    update: {
      name: 'BlueSky Retail Pvt Ltd',
      status: 'ACTIVE',
    },
    create: {
      id: 'aaaa0000-0000-0000-0000-000000000002',
      name: 'BlueSky Retail Pvt Ltd',
      slug: 'bluesky-retail',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Tenants seeded: ${tenant1.name} (${tenant1.id}), ${tenant2.name} (${tenant2.id})`);

  // 3. Departments
  const deptRd = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'RD' } },
    update: { name: 'Research & Diagnostics' },
    create: {
      tenantId: tenant1.id,
      code: 'RD',
      name: 'Research & Diagnostics',
    },
  });

  const deptQa = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'QA' } },
    update: { name: 'Quality Assurance' },
    create: {
      tenantId: tenant1.id,
      code: 'QA',
      name: 'Quality Assurance',
    },
  });

  const deptFin = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'FIN' } },
    update: { name: 'Finance & Compliance' },
    create: {
      tenantId: tenant1.id,
      code: 'FIN',
      name: 'Finance & Compliance',
    },
  });

  const deptExec = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'EXEC' } },
    update: { name: 'Executive Leadership' },
    create: {
      tenantId: tenant1.id,
      code: 'EXEC',
      name: 'Executive Leadership',
    },
  });

  // 4. Cost Centers
  const ccBio = await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'CC-BIO-04' } },
    update: { name: 'Direct Bio-Lab Diagnostics' },
    create: {
      tenantId: tenant1.id,
      code: 'CC-BIO-04',
      name: 'Direct Bio-Lab Diagnostics',
    },
  });

  const ccOps = await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'CC-OPS-01' } },
    update: { name: 'General Operations & Travel' },
    create: {
      tenantId: tenant1.id,
      code: 'CC-OPS-01',
      name: 'General Operations & Travel',
    },
  });

  const ccExec = await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'CC-EXEC-01' } },
    update: { name: 'Executive Operations' },
    create: {
      tenantId: tenant1.id,
      code: 'CC-EXEC-01',
      name: 'Executive Operations',
    },
  });

  // 5. Users & Personas
  const userVikram = await prisma.user.upsert({
    where: { email: 'admin@horizonsci.in' },
    update: { firstName: 'Vikram', lastName: 'Mehta', emailVerified: true },
    create: {
      id: 'aaaa1111-1111-1111-1111-111111111111',
      email: 'admin@horizonsci.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Vikram',
      lastName: 'Mehta',
      emailVerified: true,
    },
  });

  const userSarah = await prisma.user.upsert({
    where: { email: 'sarah.finance@horizonsci.in' },
    update: { firstName: 'Sarah', lastName: 'Jenkins', emailVerified: true },
    create: {
      id: 'bbbb2222-2222-2222-2222-222222222222',
      email: 'sarah.finance@horizonsci.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      emailVerified: true,
    },
  });

  const userAnita = await prisma.user.upsert({
    where: { email: 'anita.manager@horizonsci.in' },
    update: { firstName: 'Anita', lastName: 'Deshmukh', emailVerified: true },
    create: {
      id: 'cccc3333-3333-3333-3333-333333333333',
      email: 'anita.manager@horizonsci.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Anita',
      lastName: 'Deshmukh',
      emailVerified: true,
    },
  });

  const userRahul = await prisma.user.upsert({
    where: { email: 'rahul.sharma@horizonsci.in' },
    update: { firstName: 'Rahul', lastName: 'Sharma', emailVerified: true },
    create: {
      id: 'dddd4444-4444-4444-4444-444444444444',
      email: 'rahul.sharma@horizonsci.in',
      passwordHash: defaultPasswordHash,
      firstName: 'Rahul',
      lastName: 'Sharma',
      emailVerified: true,
    },
  });

  const userSuperAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@vyaymitra.internal' },
    update: { firstName: 'Platform', lastName: 'SuperAdmin', emailVerified: true },
    create: {
      id: 'eeee5555-5555-5555-5555-555555555555',
      email: 'superadmin@vyaymitra.internal',
      passwordHash: defaultPasswordHash,
      firstName: 'Platform',
      lastName: 'SuperAdmin',
      emailVerified: true,
    },
  });

  // 6. Tenant Memberships
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: userVikram.id } },
    update: { role: 'COMPANY_OWNER' },
    create: { tenantId: tenant1.id, userId: userVikram.id, role: 'COMPANY_OWNER' },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: userSarah.id } },
    update: { role: 'FINANCE_OPERATOR' },
    create: { tenantId: tenant1.id, userId: userSarah.id, role: 'FINANCE_OPERATOR' },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: userAnita.id } },
    update: { role: 'MANAGER' },
    create: { tenantId: tenant1.id, userId: userAnita.id, role: 'MANAGER' },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: userRahul.id } },
    update: { role: 'EMPLOYEE' },
    create: { tenantId: tenant1.id, userId: userRahul.id, role: 'EMPLOYEE' },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant1.id, userId: userSuperAdmin.id } },
    update: { role: 'PLATFORM_SUPER_ADMIN' },
    create: { tenantId: tenant1.id, userId: userSuperAdmin.id, role: 'PLATFORM_SUPER_ADMIN' },
  });

  // 7. Employees with Reporting Hierarchy
  const empVikram = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant1.id, employeeNumber: 'EMP-001' } },
    update: { displayName: 'Vikram Mehta', email: userVikram.email, departmentId: deptExec.id },
    create: {
      tenantId: tenant1.id,
      userId: userVikram.id,
      employeeNumber: 'EMP-001',
      displayName: 'Vikram Mehta',
      email: userVikram.email,
      departmentId: deptExec.id,
      grade: 'Executive',
      externalHrmId: 'KM-EMP-001',
    },
  });

  const empAnita = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant1.id, employeeNumber: 'EMP-002' } },
    update: { displayName: 'Anita Deshmukh', email: userAnita.email, managerId: empVikram.id, departmentId: deptRd.id },
    create: {
      tenantId: tenant1.id,
      userId: userAnita.id,
      employeeNumber: 'EMP-002',
      displayName: 'Anita Deshmukh',
      email: userAnita.email,
      departmentId: deptRd.id,
      managerId: empVikram.id,
      grade: 'Principal Investigator',
      externalHrmId: 'KM-EMP-002',
    },
  });

  const empSarah = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant1.id, employeeNumber: 'EMP-003' } },
    update: { displayName: 'Sarah Jenkins', email: userSarah.email, managerId: empVikram.id, departmentId: deptFin.id },
    create: {
      tenantId: tenant1.id,
      userId: userSarah.id,
      employeeNumber: 'EMP-003',
      displayName: 'Sarah Jenkins',
      email: userSarah.email,
      departmentId: deptFin.id,
      managerId: empVikram.id,
      grade: 'Controller',
      externalHrmId: 'KM-EMP-003',
    },
  });

  const empRahul = await prisma.employee.upsert({
    where: { tenantId_employeeNumber: { tenantId: tenant1.id, employeeNumber: 'EMP-004' } },
    update: { displayName: 'Dr. Rahul Sharma', email: userRahul.email, managerId: empAnita.id, departmentId: deptRd.id },
    create: {
      tenantId: tenant1.id,
      userId: userRahul.id,
      employeeNumber: 'EMP-004',
      displayName: 'Dr. Rahul Sharma',
      email: userRahul.email,
      departmentId: deptRd.id,
      managerId: empAnita.id,
      grade: 'Lead Scientist',
      externalHrmId: 'KM-EMP-004',
    },
  });

  console.log('✓ Employees & Reporting Lines seeded: Rahul -> Anita -> Vikram');

  // 8. Expense Categories with Accounting GL Codes & Indian GST Rules
  const categories = [
    { code: 'AIR_TRAVEL', name: 'Air Travel & Flights', account: '6010', itc: true },
    { code: 'LODGING', name: 'Lodging & Accommodation', account: '6020', itc: true },
    { code: 'MEALS', name: 'Meals & Hospitality', account: '6030', itc: false }, // Section 17(5) blocked
    { code: 'LAB_SUPPLIES', name: 'Lab Consumables & Reagents', account: '5010', itc: true },
    { code: 'GROUND_COMMUTE', name: 'Ground Commute & Taxis', account: '6015', itc: false },
    { code: 'SAAS_TOOLS', name: 'Software & Cloud Subscriptions', account: '6055', itc: true },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { tenantId_code: { tenantId: tenant1.id, code: cat.code } },
      update: { name: cat.name, accountMapping: cat.account },
      create: {
        tenantId: tenant1.id,
        code: cat.code,
        name: cat.name,
        accountMapping: cat.account,
      },
    });
  }

  // 9. Integrations (Zoho Books + KaaryaMitra)
  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId: tenant1.id, provider: 'zoho_books' } },
    update: { status: 'CONNECTED' },
    create: {
      tenantId: tenant1.id,
      provider: 'zoho_books',
      status: 'CONNECTED',
      externalOrgId: '891240182',
      apiDomain: 'zohoapis.in',
    },
  });

  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId: tenant1.id, provider: 'kaaryamitra_hrms' } },
    update: { status: 'CONNECTED' },
    create: {
      tenantId: tenant1.id,
      provider: 'kaaryamitra_hrms',
      status: 'CONNECTED',
      externalOrgId: 'HORIZON-SCI-BLR-01',
      apiDomain: 'api.kaaryamitra.internal',
    },
  });

  console.log('✓ PostgreSQL Seed completed successfully for vyaymitradb!');
}

main()
  .catch((e) => {
    console.error('Prisma seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
