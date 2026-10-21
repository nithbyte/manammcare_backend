import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const usersWithCode = await prisma.user.findMany({
    where: {
      referralCode: 'MNMF3MTBD',
    },
  });
  console.log('Users with referralCode MNMF3MTBD:', usersWithCode);

  const cyclesWithCode = await prisma.networkingCycle.findMany({
    where: {
      referralCode: 'MNMF3MTBD',
    },
    include: {
      user: true,
      stageAchievements: true,
      stageBenefits: true,
    },
  });
  console.log('Cycles with MNMF3MTBD:', JSON.stringify(cyclesWithCode, null, 2));

  const allCycles = await prisma.networkingCycle.findMany({
    include: { user: true },
  });
  console.log('All networking cycles count:', allCycles.length);
  for (const c of allCycles) {
    console.log(`User: ${c.user.fullName} (${c.user.phone}) - code: ${c.referralCode}, qualifying: ${c.qualifyingDirectMembersCount}, stage: ${c.currentStage}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
