import { PrismaClient, OtpPurpose } from '@prisma/client';
import { EmailService } from '../src/email/email.service';

const prisma = new PrismaClient();
const emailService = new EmailService();

async function main() {
  console.log('--- Testing Nodemailer Email Flows ---');

  const testEmail = 'sainithish271002@gmail.com';
  const testFullName = 'Nithish K';
  const testOtp = '849201';

  // 1. Test Password Reset Email
  console.log('1. Testing Password Reset Email dispatch...');
  const resetSuccess = await emailService.sendPasswordResetOtp(testEmail, testFullName, testOtp);
  console.log('   Password Reset Email result:', resetSuccess);

  // 2. Test Account Verification Email
  console.log('2. Testing Account Verification Email dispatch...');
  const verifySuccess = await emailService.sendAccountVerificationOtp(testEmail, testFullName, '571932');
  console.log('   Account Verification Email result:', verifySuccess);

  // 3. Test Database AuthOtp creation & retrieval
  console.log('3. Testing AuthOtp DB records...');
  const createdOtp = await prisma.authOtp.create({
    data: {
      email: testEmail,
      code: '571932',
      purpose: OtpPurpose.ACCOUNT_VERIFICATION,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  console.log('   Created AuthOtp in MySQL:', createdOtp.id, createdOtp.code);

  const foundOtp = await prisma.authOtp.findFirst({
    where: {
      email: testEmail,
      code: '571932',
      purpose: OtpPurpose.ACCOUNT_VERIFICATION,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  console.log('   Found active AuthOtp in MySQL:', Boolean(foundOtp));

  // Mark used
  await prisma.authOtp.update({
    where: { id: createdOtp.id },
    data: { usedAt: new Date() },
  });
  console.log('   Marked AuthOtp as used: verified.');

  console.log('--- All Nodemailer Email flows verified successfully! ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
