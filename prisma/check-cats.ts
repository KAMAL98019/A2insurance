import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const all = await p.vehicleCategory.findMany({ orderBy: { id: 'asc' } });
  console.log(`Total: ${all.length}`);
  for (const c of all) console.log(`  id=${c.id}  name=${c.name}  parentId=${c.parentId}`);
}
run().catch(console.error).finally(() => p.$disconnect());
