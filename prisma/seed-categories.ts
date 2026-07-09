import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Remove all existing categories cleanly (children first, then parents)
  await prisma.vehicleCategory.deleteMany({ where: { parentId: { not: null } } });
  await prisma.vehicleCategory.deleteMany({});
  console.log('Cleared existing categories');

  // Create parent groups
  const commercial  = await prisma.vehicleCategory.create({ data: { name: 'COMMERCIAL' } });
  const privateCar  = await prisma.vehicleCategory.create({ data: { name: 'PRIVATE_CAR' } });
  const twoWheeler  = await prisma.vehicleCategory.create({ data: { name: 'TWO_WHEELER' } });
  console.log(`✓ Parents: COMMERCIAL(${commercial.id}), PRIVATE_CAR(${privateCar.id}), TWO_WHEELER(${twoWheeler.id})`);

  // Children of COMMERCIAL
  for (const name of ['BUS', 'LORRY', 'MINI_TRUCK', 'AUTO', 'TAXI']) {
    await prisma.vehicleCategory.create({ data: { name, parentId: commercial.id } });
    console.log(`  ✓ COMMERCIAL → ${name}`);
  }

  // Children of PRIVATE_CAR
  for (const name of ['HATCHBACK', 'SEDAN', 'SUV', 'MUV']) {
    await prisma.vehicleCategory.create({ data: { name, parentId: privateCar.id } });
    console.log(`  ✓ PRIVATE_CAR → ${name}`);
  }

  // Children of TWO_WHEELER
  for (const name of ['SCOOTER', 'MOTORCYCLE', 'MOPED']) {
    await prisma.vehicleCategory.create({ data: { name, parentId: twoWheeler.id } });
    console.log(`  ✓ TWO_WHEELER → ${name}`);
  }

  // Verify
  const roots = await prisma.vehicleCategory.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  console.log('\nFinal tree:');
  for (const r of roots) {
    console.log(`${r.name}`);
    for (const c of r.children) console.log(`  └─ ${c.name}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
