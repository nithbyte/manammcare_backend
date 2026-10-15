import { PrismaClient, Role, UserStatus, MembershipStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function calculatePaymentDueDate(achievementDate: Date): Date {
  const dueDate = new Date(achievementDate.getTime());
  dueDate.setDate(dueDate.getDate() + 30);
  return dueDate;
}

async function main() {
  const targetEmail = 'sainithish271002@gmail.com';
  const targetRefCode = 'MNMF3MTBD';
  const directMembersCount = 125;

  console.log('========================================================');
  console.log(`Setting up MANAM Networking Test for: ${targetEmail}`);
  console.log(`Referral Code: ${targetRefCode}`);
  console.log(`Target Direct Qualifying Members: ${directMembersCount}`);
  console.log('========================================================\n');

  const hashedPassword = await bcrypt.hash('Password@123', 10);
  const now = new Date();

  // 1. Find or create the primary user
  let user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.log(`User ${targetEmail} not found. Creating user account...`);
    user = await prisma.user.create({
      data: {
        email: targetEmail,
        fullName: 'Sai Nithish',
        phone: '+919876543210',
        password: hashedPassword,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        membershipStatus: MembershipStatus.MEMBER,
        membershipActivatedAt: now,
        referralCode: targetRefCode,
      },
    });
    console.log(`✅ Created user ${user.id} (${user.email})`);
  } else {
    console.log(`Found existing user ${user.id} (${user.email}). Updating membership & referral code...`);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        membershipStatus: MembershipStatus.MEMBER,
        membershipActivatedAt: user.membershipActivatedAt || now,
        referralCode: targetRefCode,
      },
    });
    console.log(`✅ Updated user ${user.id} with referral code ${targetRefCode}`);
  }

  // 2. Ensure active NetworkingCycle #1
  let cycle = await prisma.networkingCycle.findFirst({
    where: {
      userId: user.id,
      cycleNumber: 1,
    },
  });

  if (!cycle) {
    cycle = await prisma.networkingCycle.create({
      data: {
        userId: user.id,
        cycleNumber: 1,
        referralCode: targetRefCode,
        status: 'ACTIVE',
        qualifyingDirectMembersCount: 0,
        currentStage: 0,
        startedAt: now,
      },
    });
    console.log(`✅ Created NetworkingCycle #1 (${cycle.id})`);
  } else {
    cycle = await prisma.networkingCycle.update({
      where: { id: cycle.id },
      data: {
        referralCode: targetRefCode,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Verified active NetworkingCycle #1 (${cycle.id})`);
  }

  // 3. Create 125 direct qualifying member accounts and referrals
  console.log(`\nCreating ${directMembersCount} direct qualifying members...`);

  const createdReferralIds: string[] = [];

  for (let i = 1; i <= directMembersCount; i++) {
    const padIndex = String(i).padStart(3, '0');
    const memberEmail = `nithish_member_${padIndex}@manamcare.com`;
    const memberPhone = `+919800000${padIndex}`;
    const memberName = `Direct Member ${padIndex}`;
    const memberRefCode = `MNM${padIndex}X${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Upsert customer user
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
        password: hashedPassword,
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
        membershipStatus: MembershipStatus.MEMBER,
        membershipActivatedAt: now,
        referralCode: memberRefCode,
      },
    });

    // Upsert referral attribution
    const referral = await prisma.referral.upsert({
      where: { referredUserId: referredUser.id },
      update: {
        referrerId: user.id,
        referralCodeUsed: targetRefCode,
        cycleId: cycle.id,
        status: 'ACTIVATED',
        activatedAt: now,
      },
      create: {
        referrerId: user.id,
        referredUserId: referredUser.id,
        referralCodeUsed: targetRefCode,
        cycleId: cycle.id,
        status: 'ACTIVATED',
        activatedAt: now,
      },
    });

    createdReferralIds.push(referral.id);

    if (i % 25 === 0 || i === directMembersCount) {
      console.log(`  Processed ${i}/${directMembersCount} direct referrals...`);
    }
  }

  // 4. Update Referrer's Cycle Stats (Stage 3 achieved with 125 members)
  const actualCount = await prisma.referral.count({
    where: {
      referrerId: user.id,
      status: 'ACTIVATED',
      OR: [{ cycleId: cycle.id }, { referralCodeUsed: targetRefCode }],
    },
  });

  cycle = await prisma.networkingCycle.update({
    where: { id: cycle.id },
    data: {
      qualifyingDirectMembersCount: actualCount,
      currentStage: 3,
    },
  });
  console.log(`\n✅ Updated cycle stats: ${actualCount} direct members, Current Stage = 3`);

  // 5. Create Stage Achievements for Stages 1, 2, and 3
  const stageConfigs = [
    { stage: 1, required: 5, isPayable: false, amount: 0 },
    { stage: 2, required: 25, isPayable: false, amount: 0 },
    { stage: 3, required: 125, isPayable: true, amount: 2500 },
  ];

  for (const sc of stageConfigs) {
    const achievement = await prisma.stageAchievement.upsert({
      where: {
        cycleId_stageNumber: {
          cycleId: cycle.id,
          stageNumber: sc.stage,
        },
      },
      update: {
        requiredDirectMembers: sc.required,
        achievedAt: now,
      },
      create: {
        userId: user.id,
        cycleId: cycle.id,
        stageNumber: sc.stage,
        requiredDirectMembers: sc.required,
        achievedAt: now,
      },
    });

    console.log(`✅ Stage ${sc.stage} Achievement recorded (Required: ${sc.required} members)`);

    // 6. If payable stage (Stage >= 3), create independent StageBenefit record with 30-day due date
    if (sc.isPayable && sc.amount > 0) {
      const dueDate = calculatePaymentDueDate(now);

      const benefit = await prisma.stageBenefit.upsert({
        where: { stageAchievementId: achievement.id },
        update: {
          amount: sc.amount,
          achievementDate: now,
          paymentDueDate: dueDate,
          status: 'PENDING',
        },
        create: {
          userId: user.id,
          cycleId: cycle.id,
          stageAchievementId: achievement.id,
          stageNumber: sc.stage,
          amount: sc.amount,
          achievementDate: now,
          paymentDueDate: dueDate,
          status: 'PENDING',
        },
      });

      console.log(`\n🎉 STAGE ${sc.stage} BENEFIT CREATED!`);
      console.log(`   Amount: ₹${sc.amount}`);
      console.log(`   Achievement Date: ${now.toLocaleDateString('en-IN')}`);
      console.log(`   Payment Due Date (+30 calendar days): ${dueDate.toLocaleDateString('en-IN')}`);
      console.log(`   Status: ${benefit.status}`);
    }
  }

  console.log('\n========================================================');
  console.log('           SEEDING COMPLETED SUCCESSFULLY!              ');
  console.log('========================================================');
  console.log(`User: ${user.fullName} (${user.email})`);
  console.log(`Referral Code: ${user.referralCode}`);
  console.log(`Membership: ${user.membershipStatus}`);
  console.log(`Direct Qualifying Referrals: ${actualCount}`);
  console.log(`Current Stage: Stage 3`);
  console.log(`Earned Benefits: Stage 3 -> ₹2,500 (Payment Due in 30 days)`);
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('Error during referral test seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
