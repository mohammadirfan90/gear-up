import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      name: process.env.ADMIN_NAME || 'GearUp Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@gearup.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: Role.admin,
    },
    {
      name: 'GearUp Customer',
      email: 'customer@gearup.com',
      password: 'Customer@12345',
      role: Role.customer,
    },
    {
      name: 'GearUp Provider',
      email: 'provider@gearup.com',
      password: 'Provider@12345',
      role: Role.provider,
    },
  ];

  console.log('Seeding users...');

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashedPassword,
        name: u.name,
        role: u.role,
        status: UserStatus.active,
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        status: UserStatus.active,
      },
    });

    console.log(`User seeded: ${user.email} (${user.role}) - ID: ${user.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
