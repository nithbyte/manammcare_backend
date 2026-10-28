import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const otps = await prisma.authOtp.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('Latest AuthOtp records:', otps);
}

main().finally(() => prisma.$disconnect());
