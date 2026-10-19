import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding synthetic tenant data...');

  // 1. Tenant 1: Horizon Scientific India Ltd
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'horizon-scientific' },
    update: {},
    create: {
      name: 'Horizon Scientific India Ltd',
      slug: 'horizon-scientific',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      status: 'ACTIVE',
    },
  });

  // 2. Tenant 2: BlueSky Retail Pvt Ltd (for cross-tenant negative testing)
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'bluesky-retail' },
    update: {},
    create: {
      name: 'BlueSky Retail Pvt Ltd',
      slug: 'bluesky-retail',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      status: 'ACTIVE',
    },
  });

  // Departments for Tenant 1
  const deptRd = await prisma.department.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'RD' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      code: 'RD',
      name: 'Research & Development',
    },
  });

  // Categories for Tenant 1
  const catTravel = await prisma.category.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'TRAVEL' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      code: 'TRAVEL',
      name: 'Travel & Conveyance',
      accountMapping: '6010',
    },
  });

  const catLab = await prisma.category.upsert({
    where: { tenantId_code: { tenantId: tenant1.id, code: 'LAB' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      code: 'LAB',
      name: 'Lab Consumables & Reagents',
      accountMapping: '6020',
    },
  });

  // Integration Record for Tenant 1
  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId: tenant1.id, provider: 'zoho_books' } },
    update: {},
    create: {
      tenantId: tenant1.id,
      provider: 'zoho_books',
      status: 'CONNECTED',
      externalOrgId: '891240182',
      apiDomain: 'zohoapis.in',
    },
  });

  console.log('Seed completed successfully.');
  console.log(`Tenant 1: ${tenant1.name} (ID: ${tenant1.id})`);
  console.log(`Tenant 2: ${tenant2.name} (ID: ${tenant2.id})`);
}

main()
  .catch((e) => {
    console.warn(`Prisma seed skipped or deferred (database not populated yet): ${e.message}`);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
