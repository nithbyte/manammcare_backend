import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: 'ADMIN' },
        { email: { contains: 'admin' } }
      ]
    },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      password: true,
      status: true,
      role: true,
    }
  });

  console.log('Found matching users:', users.length);
  for (const u of users) {
    console.log(`User: ${u.email} | Phone: ${u.phone} | Role: ${u.role} | Status: ${u.status}`);
    console.log(`  Stored hash: ${u.password}`);
    const check1 = await bcrypt.compare('Admin@1234', u.password);
    const check2 = await bcrypt.compare('Admin@123', u.password);
    const check3 = await bcrypt.compare('admin123', u.password);
    const check4 = await bcrypt.compare('password', u.password);
    const check5 = await bcrypt.compare('admin', u.password);
    const check6 = await bcrypt.compare('Admin@1', u.password);
    console.log(`  Password checks -> Admin@1234: ${check1}, Admin@123: ${check2}, admin123: ${check3}, password: ${check4}, admin: ${check5}, Admin@1: ${check6}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
