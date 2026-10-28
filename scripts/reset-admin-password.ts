import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting Admin credentials for admin@manammcare.com...');
  
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);

  const updatedAdmin = await prisma.user.upsert({
    where: { email: 'admin@manammcare.com' },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone: '+91 98888 77777',
      fullName: 'MANAMM Administrator',
    },
    create: {
      id: 'usr_admin_1',
      email: 'admin@manammcare.com',
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone: '+91 98888 77777',
      fullName: 'MANAMM Administrator',
    },
  });

  console.log('Admin user updated successfully:');
  console.log(`  ID: ${updatedAdmin.id}`);
  console.log(`  Email: ${updatedAdmin.email}`);
  console.log(`  Role: ${updatedAdmin.role}`);
  console.log(`  Status: ${updatedAdmin.status}`);

  const verify = await bcrypt.compare('Admin@1234', updatedAdmin.password);
  console.log(`  Password 'Admin@1234' verification: ${verify}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
