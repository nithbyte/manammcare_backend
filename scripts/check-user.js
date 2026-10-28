const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, password: true }
  });
  console.log('Total users:', users.length);
  for (const u of users.slice(0, 5)) {
    const is123 = await bcrypt.compare('Password@123', u.password);
    console.log(u.email, u.role, 'Pass@123:', is123);
  }
  const admin = users.find(u => u.role === 'ADMIN');
  if (admin) {
    const is123 = await bcrypt.compare('Password@123', admin.password);
    console.log('Admin:', admin.email, 'Pass@123:', is123);
  }
}
main().finally(() => prisma.$disconnect());
