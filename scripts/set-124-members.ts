import { PrismaClient, MembershipStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'sainithish271002@gmail.com';
  const targetRefCode = 'MNMF3MTBD';

  console.log('========================================================');
  console.log(`Resetting direct members count to 124 for: ${targetEmail}`);
  console.log(`Referral Code: ${targetRefCode}`);
  console.log('========================================================\n');

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: { networkingCycles: true },
  });

  if (!user) {
    throw new Error(`User ${targetEmail} not found!`);
  }

  const cycle = user.networkingCycles.find((c) => c.cycleNumber === 1) || user.networkingCycles[0];
  if (!cycle) {
    throw new Error(`No cycle found for user ${targetEmail}!`);
  }

  // 2. Delete Stage 3 Benefit & Achievement so Stage 3 is NOT paid or completed
  console.log('Deleting Stage 3 benefit and achievement records...');
  const stage3Benefit = await prisma.stageBenefit.findFirst({
    where: { userId: user.id, stageNumber: 3 },
  });

  if (stage3Benefit) {
    // Delete any audit logs for this benefit
    await prisma.benefitAuditLog.deleteMany({
      where: { benefitId: stage3Benefit.id },
    });
    await prisma.stageBenefit.delete({
      where: { id: stage3Benefit.id },
    });
    console.log(`✅ Deleted Stage 3 Benefit (${stage3Benefit.id})`);
  }

  const stage3Achievement = await prisma.stageAchievement.findFirst({
    where: { cycleId: cycle.id, stageNumber: 3 },
  });

  if (stage3Achievement) {
    await prisma.stageAchievement.delete({
      where: { id: stage3Achievement.id },
    });
    console.log(`✅ Deleted Stage 3 Achievement (${stage3Achievement.id})`);
  }

  // 3. Keep exactly 124 active referrals
  const allActiveReferrals = await prisma.referral.findMany({
    where: {
      referrerId: user.id,
      status: 'ACTIVATED',
      OR: [{ cycleId: cycle.id }, { referralCodeUsed: targetRefCode }],
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${allActiveReferrals.length} active referrals for user.`);

  if (allActiveReferrals.length > 124) {
    const toRemove = allActiveReferrals.slice(0, allActiveReferrals.length - 124);
    for (const ref of toRemove) {
      await prisma.referral.delete({ where: { id: ref.id } });
      if (ref.referredUserId) {
        try {
          await prisma.user.delete({ where: { id: ref.referredUserId } });
        } catch {}
      }
      console.log(`✅ Removed excess referral ${ref.id}`);
    }
  }

  // 4. Recount direct active referrals
  const activeReferralsCount = await prisma.referral.count({
    where: {
      referrerId: user.id,
      status: 'ACTIVATED',
      OR: [{ cycleId: cycle.id }, { referralCodeUsed: targetRefCode }],
    },
  });

  console.log(`Actual active referrals count in database: ${activeReferralsCount}`);

  // 5. Update cycle stats to Stage 2 with 124 members
  await prisma.networkingCycle.update({
    where: { id: cycle.id },
    data: {
      qualifyingDirectMembersCount: activeReferralsCount,
      currentStage: 2,
    },
  });

  console.log(`✅ Updated cycle: qualifyingDirectMembersCount = ${activeReferralsCount}, currentStage = 2`);

  // 6. Ensure Stage 1 and Stage 2 achievements exist
  const stage1 = await prisma.stageAchievement.findFirst({
    where: { cycleId: cycle.id, stageNumber: 1 },
  });
  if (!stage1) {
    await prisma.stageAchievement.create({
      data: {
        userId: user.id,
        cycleId: cycle.id,
        stageNumber: 1,
        requiredDirectMembers: 5,
        achievedAt: new Date(),
      },
    });
  }

  const stage2 = await prisma.stageAchievement.findFirst({
    where: { cycleId: cycle.id, stageNumber: 2 },
  });
  if (!stage2) {
    await prisma.stageAchievement.create({
      data: {
        userId: user.id,
        cycleId: cycle.id,
        stageNumber: 2,
        requiredDirectMembers: 25,
        achievedAt: new Date(),
      },
    });
  }

  console.log('\n========================================================');
  console.log('              UPDATE COMPLETED SUCCESSFULLY             ');
  console.log('========================================================');
  console.log(`User: ${user.fullName} (${user.email})`);
  console.log(`Referral Code: ${targetRefCode}`);
  console.log(`Current Stage: Stage 2 (Milestone: 25 direct members)`);
  console.log(`Qualifying Direct Members: ${activeReferralsCount}`);
  console.log(`Next Milestone: Stage 3 (Target: 125 direct members)`);
  console.log(`Members Needed to unlock Stage 3: ${125 - activeReferralsCount} member`);
  console.log(`Stage 3 Benefit: Ready to be unlocked when member 125 is delivered!`);
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('Error setting 124 members:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
