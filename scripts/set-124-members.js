const { PrismaClient, MembershipStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'sainithish271002@gmail.com';
  console.log(`Setting up 124 members for: ${targetEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      networkingCycles: true,
      stageAchievements: true,
      stageBenefits: true,
    },
  });

  if (!user) {
    console.error(`User ${targetEmail} not found!`);
    return;
  }

  const cycle = user.networkingCycles.find((c) => c.status === 'ACTIVE') || user.networkingCycles[0];
  if (!cycle) {
    console.error('No cycle found for user!');
    return;
  }

  // 1. Fetch all referrals for user
  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Current total referrals: ${referrals.length}`);

  // 2. Adjust referrals count to exactly 124
  if (referrals.length > 124) {
    const excess = referrals.slice(124);
    console.log(`Deleting ${excess.length} excess referrals beyond 124...`);
    for (const ref of excess) {
      await prisma.referral.delete({ where: { id: ref.id } });
      // If there was a referred user created specifically as test member, delete or leave as is
      try {
        if (ref.referredUserId.includes('test') || ref.referredUserId.startsWith('cm')) {
          // keep user or let it be
        }
      } catch (e) {}
    }
  } else if (referrals.length < 124) {
    console.log(`Need to add ${124 - referrals.length} referrals to reach 124...`);
    const now = new Date();
    for (let i = referrals.length + 1; i <= 124; i++) {
      const padIndex = String(i).padStart(3, '0');
      const memberEmail = `nithish_member_${padIndex}@manammcare.com`;
      const memberPhone = `+919800000${padIndex}`;
      const memberName = `Direct Member ${padIndex}`;
      const memberRefCode = `MNM${padIndex}X${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const referredUser = await prisma.user.upsert({
        where: { email: memberEmail },
        update: {
          membershipStatus: MembershipStatus.MEMBER,
          membershipActivatedAt: now,
        },
        create: {
          email: memberEmail,
          fullName: memberName,
          phone: memberPhone,
          password: 'Password@123',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          membershipStatus: MembershipStatus.MEMBER,
          membershipActivatedAt: now,
          referralCode: memberRefCode,
        },
      });

      await prisma.referral.upsert({
        where: { referredUserId: referredUser.id },
        update: {
          referrerId: user.id,
          referralCodeUsed: user.referralCode,
          cycleId: cycle.id,
          status: 'ACTIVATED',
          activatedAt: now,
        },
        create: {
          referrerId: user.id,
          referredUserId: referredUser.id,
          referralCodeUsed: user.referralCode,
          cycleId: cycle.id,
          status: 'ACTIVATED',
          activatedAt: now,
        },
      });
    }
  }

  // Ensure all 124 referrals are ACTIVATED and associated with the cycle
  await prisma.referral.updateMany({
    where: { referrerId: user.id },
    data: {
      status: 'ACTIVATED',
      cycleId: cycle.id,
      referralCodeUsed: user.referralCode,
    },
  });

  const verifiedReferralCount = await prisma.referral.count({
    where: { referrerId: user.id, status: 'ACTIVATED' },
  });
  console.log(`Verified active referrals: ${verifiedReferralCount}`);

  // 3. Remove Stage 3 achievements & benefits so user is pending Stage 3 (125 members)
  console.log('Removing Stage 3 benefits & achievements...');
  await prisma.stageBenefit.deleteMany({
    where: {
      userId: user.id,
      stageNumber: { gte: 3 },
    },
  });

  await prisma.stageAchievement.deleteMany({
    where: {
      userId: user.id,
      stageNumber: { gte: 3 },
    },
  });

  // 4. Ensure Stage 1 and Stage 2 achievements exist
  const now = new Date();
  await prisma.stageAchievement.upsert({
    where: {
      cycleId_stageNumber: {
        cycleId: cycle.id,
        stageNumber: 1,
      },
    },
    update: {
      requiredDirectMembers: 5,
    },
    create: {
      userId: user.id,
      cycleId: cycle.id,
      stageNumber: 1,
      requiredDirectMembers: 5,
      achievedAt: now,
    },
  });

  await prisma.stageAchievement.upsert({
    where: {
      cycleId_stageNumber: {
        cycleId: cycle.id,
        stageNumber: 2,
      },
    },
    update: {
      requiredDirectMembers: 25,
    },
    create: {
      userId: user.id,
      cycleId: cycle.id,
      stageNumber: 2,
      requiredDirectMembers: 25,
      achievedAt: now,
    },
  });

  // 5. Update Cycle stats
  await prisma.networkingCycle.update({
    where: { id: cycle.id },
    data: {
      qualifyingDirectMembersCount: 124,
      currentStage: 2,
      status: 'ACTIVE',
    },
  });

  console.log('Cycle stats updated to 124 members, Stage 2.');

  // 6. Print summary
  const finalCycle = await prisma.networkingCycle.findUnique({ where: { id: cycle.id } });
  const finalAchievements = await prisma.stageAchievement.findMany({ where: { userId: user.id } });
  const finalBenefits = await prisma.stageBenefit.findMany({ where: { userId: user.id } });

  console.log('\n======================================================');
  console.log('           124 MEMBERS SETUP COMPLETED!               ');
  console.log('======================================================');
  console.log(`User: ${user.fullName} (${user.email})`);
  console.log(`Referral Code: ${user.referralCode}`);
  console.log(`Qualifying Members: ${finalCycle.qualifyingDirectMembersCount} / 125`);
  console.log(`Current Stage: Stage ${finalCycle.currentStage} (Achieved Stage 1 & 2)`);
  console.log(`Next Stage: Stage 3 (125 members needed -> 1 MORE MEMBER TO UNLOCK STAGE 3!)`);
  console.log(`Next Benefit to Unlock: ₹2,500`);
  console.log(`Stage Achievements in DB:`, finalAchievements.map(a => `Stage ${a.stageNumber} (${a.requiredDirectMembers} members)`));
  console.log(`Active Benefits in DB:`, finalBenefits.length ? finalBenefits : 'None (Stage 3 benefit pending activation)');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
