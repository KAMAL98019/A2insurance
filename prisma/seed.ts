import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const SALT = 12;

  // ── Users ────────────────────────────────────────────────────────────────
  const userSeeds = [
    {
      name: 'Admin User',
      email: 'admin@a2insurance.com',
      phoneNumber: '+1 555 000 0001',
      password: await bcrypt.hash('Admin1234', SALT),
      role: Role.ADMIN,
    },
    {
      name: 'John Doe',
      email: 'john@a2insurance.com',
      phoneNumber: '+1 555 000 0002',
      password: await bcrypt.hash('User1234', SALT),
      role: Role.USER,
    },
  ];

  for (const seed of userSeeds) {
    await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: seed,
    });
    console.log(`✓ User: ${seed.email}  (${seed.role})`);
  }

  // ── Default Categories ───────────────────────────────────────────────────
  const defaultCategories = ['TW', 'CAR', 'COMMERCIAL'];

  for (const name of defaultCategories) {
    await prisma.vehicleCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`✓ Category: ${name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
