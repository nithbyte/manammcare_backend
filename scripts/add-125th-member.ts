import { PrismaClient, MembershipStatus } from '@prisma/client';

const prisma = new PrismaClient();

function calculatePaymentDueDate(baseDate: Date): Date {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + 30);
  return d;
}

async function main() {
  const targetEmail = 'sainithish271002@gmail.com';
  const targetRefCode = 'MNMF3MTBD';

  console.log('========================================================');
  console.log('      ACTIVATING 125TH MEMBER & UNLOCKING STAGE 3       ');
  console.log(`Target: ${targetEmail} (Referral Code: ${targetRefCode})`);
  console.log('========================================================\n');

  // 1. Find user and cycle
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

  // 2. Create or find 125th member
  const memberEmail = 'nithish_member_125@manamcare.com';
  const memberPhone = '+919876543125';
  const memberName = 'Member 125 (Arun)';

  let member125 = await prisma.user.findUnique({
    where: { email: memberEmail },
  });

  if (!member125) {
    member125 = await prisma.user.create({
      data: {
        fullName: memberName,
        email: memberEmail,
        phone: memberPhone,
        password: 'Password@123',
        membershipStatus: MembershipStatus.MEMBER,
        membershipActivatedAt: new Date(),
        referralCode: `MNMMEM125`,
        role: 'CUSTOMER',
      },
    });
    console.log(`✅ Created User: ${memberName} (${memberEmail})`);
  } else {
    console.log(`ℹ️ Member 125 already exists (${memberEmail})`);
  }

  // 3. Link Referral
  let referral = await prisma.referral.findFirst({
    where: { referredUserId: member125.id },
  });

  const now = new Date();
  if (!referral) {
    referral = await prisma.referral.create({
      data: {
        referrerId: user.id,
        referredUserId: member125.id,
        referralCodeUsed: targetRefCode,
        cycleId: cycle.id,
        status: 'ACTIVATED',
        activatedAt: now,
      },
    });
    console.log(`✅ Linked Referral record (ACTIVATED)`);
  } else {
    referral = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        referrerId: user.id,
        cycleId: cycle.id,
        status: 'ACTIVATED',
        activatedAt: now,
      },
    });
  }

  // 4. Create delivered qualifying order (> ₹500)
  const orderNumber = `MNM-QUAL-125-${Date.now().toString().slice(-4)}`;
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: member125.id,
      customerName: memberName,
      customerPhone: memberPhone,
      subtotal: 699,
      grandTotal: 699,
      status: 'DELIVERED',
      paymentStatus: 'SUCCESS',
      paymentMethod: 'RAZORPAY',
      createdAt: now,
      shippingAddress: {
        fullName: memberName,
        phone: memberPhone,
        street: '125 Farm Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
      },
    },
  });
  console.log(`✅ Created Qualifying Delivered Order: ${order.orderNumber} (₹${order.grandTotal})`);

  // 5. Update direct count in active cycle to exactly 125
  const activeCount = await prisma.referral.count({
    where: {
      referrerId: user.id,
      status: 'ACTIVATED',
      OR: [{ cycleId: cycle.id }, { referralCodeUsed: targetRefCode }],
    },
  });

  await prisma.networkingCycle.update({
    where: { id: cycle.id },
    data: {
      qualifyingDirectMembersCount: activeCount,
      currentStage: 3,
    },
  });
  console.log(`✅ Cycle updated: qualifyingDirectMembersCount = ${activeCount}, currentStage = 3`);

  // 6. Ensure Stage 3 Achievement
  let stage3Achievement = await prisma.stageAchievement.findFirst({
    where: { cycleId: cycle.id, stageNumber: 3 },
  });

  if (!stage3Achievement) {
    stage3Achievement = await prisma.stageAchievement.create({
      data: {
        userId: user.id,
        cycleId: cycle.id,
        stageNumber: 3,
        requiredDirectMembers: 125,
        achievedAt: now,
      },
    });
    console.log(`✅ Created Stage 3 Achievement (${stage3Achievement.id})`);
  }

  // 7. Create Stage 3 Benefit (₹2,500 with 30-day payment due date)
  let stage3Benefit = await prisma.stageBenefit.findFirst({
    where: { stageAchievementId: stage3Achievement.id },
  });

  const dueDate = calculatePaymentDueDate(now);

  if (!stage3Benefit) {
    stage3Benefit = await prisma.stageBenefit.create({
      data: {
        userId: user.id,
        cycleId: cycle.id,
        stageAchievementId: stage3Achievement.id,
        stageNumber: 3,
        amount: 2500,
        achievementDate: now,
        paymentDueDate: dueDate,
        status: 'PENDING',
      },
    });
    console.log(`✅ Created Stage 3 Benefit (₹2,500) — Status: PENDING, Due: ${dueDate.toISOString()}`);
  } else {
    // If it was somehow existing, ensure it is PENDING so user can test paying it
    stage3Benefit = await prisma.stageBenefit.update({
      where: { id: stage3Benefit.id },
      data: {
        status: 'PENDING',
        paymentDueDate: dueDate,
        paymentDate: null,
        paymentProofUrl: null,
        gpayReferenceId: null,
        confirmedAt: null,
      },
    });
    console.log(`✅ Reset Stage 3 Benefit to PENDING for payment testing`);
  }

  console.log('\n========================================================');
  console.log('       STAGE 3 BENEFIT READY IN ADMIN BENEFIT QUEUE!     ');
  console.log('========================================================');
  console.log(`Benefit ID: ${stage3Benefit.id}`);
  console.log(`Member: ${user.fullName} (${user.phone})`);
  console.log(`Amount: ₹2,500`);
  console.log(`Status: PENDING`);
  console.log(`Due Date: ${dueDate.toLocaleDateString()}`);
  console.log('\nYou can now open http://localhost:8082/transactions to test:');
  console.log('1. See 1 PENDING item in the queue');
  console.log('2. Click "Record Payment"');
  console.log('3. Enter GPay Reference ID & upload payment proof screenshot');
  console.log('4. Confirm and see it marked as PAID in both Admin & Customer apps!');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('Error adding 125th member:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
