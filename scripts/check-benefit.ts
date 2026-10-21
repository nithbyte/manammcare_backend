import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const benefits = await prisma.stageBenefit.findMany();
  for (const b of benefits) {
    console.log({
      id: b.id,
      stageNumber: b.stageNumber,
      amount: b.amount,
      status: b.status,
      paymentDate: (b as any).paymentDate,
      gpayReferenceId: b.gpayReferenceId,
      paymentProofUrl: b.paymentProofUrl ? b.paymentProofUrl.substring(0, 100) + '...' : null,
      fullLength: b.paymentProofUrl ? b.paymentProofUrl.length : 0,
      startsWith: b.paymentProofUrl ? b.paymentProofUrl.substring(0, 30) : null,
    });
  }
}

main().finally(() => prisma.$disconnect());
