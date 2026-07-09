import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('Passw0rd1', 12);

  const master = await prisma.user.upsert({
    where: { email: 'master@a2insurance.com' },
    update: {},
    create: {
      name: 'Master Admin', email: 'master@a2insurance.com', phoneNumber: '9000000001',
      password: pw, role: 'MASTER_ADMIN', status: 'ACTIVE',
    },
  });

  const erode = await prisma.location.upsert({
    where: { code: 'ERD' }, update: {},
    create: { name: 'Erode Branch', code: 'ERD', createdById: master.id },
  });
  const chennai = await prisma.location.upsert({
    where: { code: 'CHN' }, update: {},
    create: { name: 'Chennai Branch', code: 'CHN', createdById: master.id },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@a2insurance.com' }, update: {},
    create: {
      name: 'Erode Super Admin', email: 'super@a2insurance.com', phoneNumber: '9000000002',
      password: pw, role: 'SUPER_ADMIN', status: 'ACTIVE', createdById: master.id,
    },
  });
  await prisma.userLocation.upsert({
    where: { userId_locationId: { userId: superAdmin.id, locationId: erode.id } },
    update: {},
    create: { userId: superAdmin.id, locationId: erode.id, assignedById: master.id },
  });

  const adminA = await prisma.user.upsert({
    where: { email: 'adminA@a2insurance.com' }, update: {},
    create: {
      name: 'Admin User A', email: 'adminA@a2insurance.com', phoneNumber: '9000000003',
      password: pw, role: 'ADMIN_USER', status: 'ACTIVE',
      createdById: superAdmin.id, superAdminId: superAdmin.id, primaryLocationId: erode.id,
    },
  });
  await prisma.userLocation.upsert({
    where: { userId_locationId: { userId: adminA.id, locationId: erode.id } },
    update: {},
    create: { userId: adminA.id, locationId: erode.id, assignedById: superAdmin.id },
  });
  await prisma.adminUserPermission.upsert({
    where: { adminUserId_moduleName: { adminUserId: adminA.id, moduleName: 'vehicle-records' } },
    update: {},
    create: {
      adminUserId: adminA.id, moduleName: 'vehicle-records',
      canView: true, canCreate: true, canUpdate: true, canDelete: false, canExport: false,
      assignedById: superAdmin.id,
    },
  });
  await prisma.adminUserPermission.upsert({
    where: { adminUserId_moduleName: { adminUserId: adminA.id, moduleName: 'renewals' } },
    update: {},
    create: {
      adminUserId: adminA.id, moduleName: 'renewals',
      canView: true, canCreate: false, canUpdate: false, canDelete: false, canExport: false,
      assignedById: superAdmin.id,
    },
  });

  const adminB = await prisma.user.upsert({
    where: { email: 'adminB@a2insurance.com' }, update: {},
    create: {
      name: 'Admin User B', email: 'adminB@a2insurance.com', phoneNumber: '9000000004',
      password: pw, role: 'ADMIN_USER', status: 'ACTIVE',
      createdById: superAdmin.id, superAdminId: superAdmin.id, primaryLocationId: chennai.id,
    },
  });
  await prisma.userLocation.upsert({
    where: { userId_locationId: { userId: adminB.id, locationId: chennai.id } },
    update: {},
    create: { userId: adminB.id, locationId: chennai.id, assignedById: superAdmin.id },
  });

  console.log('Seeded RBAC hierarchy:');
  console.log({
    master: master.email,
    superAdmin: superAdmin.email,
    adminA: `${adminA.email} (Erode, vehicle-records view+create+update, renewals view-only)`,
    adminB: `${adminB.email} (Chennai, no permissions granted yet)`,
  });
  console.log('All passwords: Passw0rd1');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
