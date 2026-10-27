const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'sainithish271002@gmail.com';
  console.log(`Checking & resetting KYC/Valid Customer for ${targetEmail}...`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: { customerVerification: true },
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log('Current state before reset:', {
    id: user.id,
    email: user.email,
    isValidCustomer: user.isValidCustomer,
    hasCustomerVerification: Boolean(user.customerVerification),
    verificationDetails: user.customerVerification,
  });

  // 1. Delete CustomerVerification record if exists
  if (user.customerVerification) {
    await prisma.customerVerification.delete({
      where: { userId: user.id },
    });
    console.log('✅ Deleted CustomerVerification record.');
  }

  // 2. Set isValidCustomer to false
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isValidCustomer: false,
    },
  });
  console.log('✅ Updated User: isValidCustomer = false.');

  // 3. Verify
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { customerVerification: true },
  });

  console.log('State after reset:', {
    id: updatedUser.id,
    email: updatedUser.email,
    isValidCustomer: updatedUser.isValidCustomer,
    customerVerification: updatedUser.customerVerification,
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
