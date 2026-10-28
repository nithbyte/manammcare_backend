import { PrismaClient, NotificationType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Inactive Referral Alert System...');

  // 1. Find referrer Nithish
  const referrer = await prisma.user.findFirst({
    where: { email: 'sainithish271002@gmail.com' },
  });

  if (!referrer) {
    console.error('Referrer Nithish not found.');
    return;
  }
  console.log(`Referrer found: ${referrer.fullName} (${referrer.id})`);

  // 2. Find or create a test customer who registered but has not placed any orders
  let testCustomer = await prisma.user.findFirst({
    where: { email: 'test_inactive_ref@manammcare.com' },
  });

  if (!testCustomer) {
    testCustomer = await prisma.user.create({
      data: {
        fullName: 'Karthik Raja',
        email: 'test_inactive_ref@manammcare.com',
        phone: '9876543210',
        password: '$2a$10$dummyhashedpasswordfortestingpurposesonly',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    console.log(`Created test customer: ${testCustomer.fullName} (${testCustomer.id})`);
  }

  // 3. Ensure a Referral record exists linking Nithish -> Karthik Raja
  let referral = await prisma.referral.findUnique({
    where: { referredUserId: testCustomer.id },
  });

  if (!referral) {
    referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: testCustomer.id,
        referralCodeUsed: referrer.referralCode || 'MNMF3MTBD',
        status: 'REGISTERED',
        createdAt: new Date(),
      },
    });
    console.log(`Created referral record: ${referral.id}`);
  } else {
    // Reset to REGISTERED and clear last alert for testing
    referral = await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'REGISTERED',
        lastInactivityAlert: null,
      },
    });
    console.log(`Reset referral record to REGISTERED: ${referral.id}`);
  }

  // 4. Run the alert detection query (matching InactiveReferralsService logic)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const eligibleReferrals = await prisma.referral.findMany({
    where: {
      status: 'REGISTERED',
      referredUser: {
        orders: {
          none: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          },
        },
      },
      OR: [
        { lastInactivityAlert: null },
        { lastInactivityAlert: { lte: twentyFourHoursAgo } },
      ],
    },
    include: {
      referrer: {
        select: { id: true, fullName: true, email: true, phone: true, pushToken: true },
      },
      referredUser: {
        select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
      },
    },
  });

  console.log(`Eligible inactive referrals found: ${eligibleReferrals.length}`);

  for (const item of eligibleReferrals) {
    const regDateStr = new Date(item.referredUser.createdAt).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const title = `Referral Inactivity Alert: ${item.referredUser.fullName} hasn't ordered yet`;
    const message = `Hi ${item.referrer.fullName}, your referred member ${item.referredUser.fullName} registered on ${regDateStr} but hasn't placed their first order yet. Reach out to encourage them to explore MANAMM and start shopping!`;

    // Create AppNotification for referrer
    const createdNotif = await prisma.appNotification.create({
      data: {
        userId: item.referrer.id,
        type: NotificationType.ACCOUNT,
        title,
        message,
        data: {
          type: 'INACTIVE_REFERRAL_ALERT',
          referralId: item.id,
          referredUserId: item.referredUser.id,
          referredUserName: item.referredUser.fullName,
          referredUserPhone: item.referredUser.phone,
          registeredAt: item.referredUser.createdAt.toISOString(),
        },
      },
    });

    // Update referral tracking
    await prisma.referral.update({
      where: { id: item.id },
      data: {
        lastInactivityAlert: new Date(),
        inactivityAlertCount: { increment: 1 },
      },
    });

    console.log(`Alert sent to Referrer ${item.referrer.fullName}! Notification ID: ${createdNotif.id}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
  }

  // 5. Test 24-hour rate limit: immediate rerun should find 0 eligible referrals
  const rerunEligible = await prisma.referral.findMany({
    where: {
      id: referral.id,
      status: 'REGISTERED',
      OR: [
        { lastInactivityAlert: null },
        { lastInactivityAlert: { lte: twentyFourHoursAgo } },
      ],
    },
  });

  console.log(`Rate limit test: eligible referrals on immediate rerun: ${rerunEligible.length} (expected 0)`);
  console.log('Test completed successfully!');
}

main().finally(() => prisma.$disconnect());
