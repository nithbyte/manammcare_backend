import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({
    where: { referralCode: 'MNMF3MTBD' },
  });
  console.log('User:', user?.id, user?.fullName, user?.phone);

  const cycle = await prisma.networkingCycle.findFirst({
    where: { referralCode: 'MNMF3MTBD' },
    include: { stageAchievements: true, stageBenefits: true },
  });
  console.log('Cycle status:', cycle?.status, 'qualifying count:', cycle?.qualifyingDirectMembersCount, 'currentStage:', cycle?.currentStage);
  console.log('Achievements:', cycle?.stageAchievements);
  console.log('Benefits:', cycle?.stageBenefits);

  const activatedReferrals = await prisma.referral.count({
    where: { referrerId: user?.id, status: 'ACTIVATED' },
  });
  console.log('Activated referrals in DB:', activatedReferrals);

  const totalReferrals = await prisma.referral.count({
    where: { referrerId: user?.id },
  });
  console.log('Total referrals in DB:', totalReferrals);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
