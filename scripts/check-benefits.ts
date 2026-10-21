import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { referralCode: 'MNMF3MTBD' },
        { email: { contains: 'nith' } },
        { phone: { contains: '95669' } },
      ],
    },
  });
  console.log('User:', user?.id, user?.fullName, user?.phone, user?.referralCode);

  if (user) {
    const referralsCount = await prisma.referral.count({
      where: { referrerId: user.id },
    });
    console.log('Total referrals:', referralsCount);

    const activeCycle = await prisma.networkingCycle.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    });
    console.log('Active cycle:', activeCycle);

    const achievements = await prisma.stageAchievement.findMany({
      where: { userId: user.id },
    });
    console.log('Achievements:', achievements);

    const benefits = await prisma.stageBenefit.findMany({
      where: { userId: user.id },
    });
    console.log('Benefits for user:', benefits);
  }

  const allBenefits = await prisma.stageBenefit.findMany();
  console.log('Total stage_benefits in entire DB:', allBenefits.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
