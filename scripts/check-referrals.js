const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const referrals = await prisma.referral.findMany({
    include: {
      referrer: { select: { id: true, fullName: true, email: true } },
      referredUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          orders: { select: { id: true, status: true, grandTotal: true } },
        },
      },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${referrals.length} sample referrals:`);
  for (const r of referrals) {
    console.log({
      id: r.id,
      referrer: r.referrer?.fullName,
      referred: r.referredUser?.fullName,
      referralStatus: r.status,
      referredCreatedAt: r.referredUser?.createdAt,
      orderCount: r.referredUser?.orders.length,
    });
  }

  // Count registered referrals with 0 orders
  const inactiveReferrals = await prisma.referral.count({
    where: {
      status: 'REGISTERED',
      referredUser: {
        orders: {
          none: {},
        },
      },
    },
  });
  console.log('Total registered referrals with 0 orders:', inactiveReferrals);
}

main().finally(() => prisma.$disconnect());
