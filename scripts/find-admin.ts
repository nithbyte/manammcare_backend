import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, fullName: true, phone: true, role: true },
  });
  console.log('Admins in DB:', admins);
}

main().finally(() => prisma.$disconnect());
