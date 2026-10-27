const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Updating Database from Manam to Manamm ===');

  // 1. Brands
  console.log('1. Updating Brands...');
  const brandUpdates = [
    { id: 'brd_manam_farm', name: 'MANAMM Farm Select', slug: 'manamm-farm-select' },
    { id: 'brd_manam_herbal', name: 'MANAMM Herbal', slug: 'manamm-herbal' },
    { id: 'brd_manam_naturals', name: 'MANAMM Naturals', slug: 'manamm-naturals' },
    { id: 'brd_manam_organics', name: 'MANAMM Organics', slug: 'manamm-organics' },
    { id: 'brd_manam_pure', name: 'MANAMM Pure', slug: 'manamm-pure' },
  ];
  for (const b of brandUpdates) {
    await prisma.brand.updateMany({
      where: { id: b.id },
      data: { name: b.name },
    });
  }
  console.log('   Brands updated.');

  // 2. Users
  console.log('2. Updating Users...');
  await prisma.user.updateMany({
    where: { fullName: 'MANAM Administrator' },
    data: { fullName: 'MANAMM Administrator' },
  });
  await prisma.user.updateMany({
    where: { fullName: 'MANAM Quality Officer' },
    data: { fullName: 'MANAMM Quality Officer' },
  });
  console.log('   Users updated.');

  // 3. Categories (SQL REPLACE)
  console.log('3. Updating Category descriptions...');
  const catResult = await prisma.$executeRawUnsafe(
    `UPDATE Category SET description = REPLACE(description, 'Manam Daily', 'Manamm Daily') WHERE description LIKE '%Manam Daily%'`
  );
  console.log(`   Categories updated: ${catResult}`);

  // 4. Products (SQL REPLACE on description)
  console.log('4. Updating Product descriptions...');
  const prodResult1 = await prisma.$executeRawUnsafe(
    `UPDATE Product SET description = REPLACE(description, 'at Manam.', 'at Manamm.') WHERE description LIKE '%at Manam.%'`
  );
  const prodResult2 = await prisma.$executeRawUnsafe(
    `UPDATE Product SET description = REPLACE(description, 'Manam Daily', 'Manamm Daily') WHERE description LIKE '%Manam Daily%'`
  );
  console.log(`   Products updated (at Manam): ${prodResult1}, (Manam Daily): ${prodResult2}`);

  // 5. FAQs
  console.log('5. Updating FAQs...');
  const faqQ = await prisma.$executeRawUnsafe(
    `UPDATE FAQ SET question = REPLACE(question, 'MANAM', 'MANAMM') WHERE question LIKE '%MANAM%'`
  );
  const faqA = await prisma.$executeRawUnsafe(
    `UPDATE FAQ SET answer = REPLACE(answer, 'MANAM', 'MANAMM') WHERE answer LIKE '%MANAM%'`
  );
  console.log(`   FAQs updated: ${faqQ} questions, ${faqA} answers`);

  // 6. Announcements
  console.log('6. Updating Announcements...');
  const annT = await prisma.$executeRawUnsafe(
    `UPDATE Announcement SET title = REPLACE(title, 'MANAM', 'MANAMM') WHERE title LIKE '%MANAM%'`
  );
  const annM = await prisma.$executeRawUnsafe(
    `UPDATE Announcement SET message = REPLACE(message, 'MANAM', 'MANAMM') WHERE message LIKE '%MANAM%'`
  );
  console.log(`   Announcements updated: ${annT} titles, ${annM} messages`);

  // 7. Policies
  console.log('7. Updating Policies...');
  const pol = await prisma.$executeRawUnsafe(
    `UPDATE Policy SET content = REPLACE(content, 'MANAM', 'MANAMM') WHERE content LIKE '%MANAM%'`
  );
  console.log(`   Policies updated: ${pol}`);

  // 8. Coupons
  console.log('8. Updating Coupons...');
  const coup = await prisma.$executeRawUnsafe(
    `UPDATE Coupon SET description = REPLACE(description, 'MANAM', 'MANAMM') WHERE description LIKE '%MANAM%'`
  );
  console.log(`   Coupons updated: ${coup}`);

  // 9. Banners
  console.log('9. Updating Banners...');
  const ban = await prisma.$executeRawUnsafe(
    `UPDATE Banner SET subtitle = REPLACE(subtitle, 'MANAM', 'MANAMM') WHERE subtitle LIKE '%MANAM%'`
  );
  console.log(`   Banners updated: ${ban}`);

  // 10. AppNotifications
  console.log('10. Updating Notifications...');
  const notT = await prisma.$executeRawUnsafe(
    `UPDATE AppNotification SET title = REPLACE(title, 'MANAM', 'MANAMM') WHERE title LIKE '%MANAM%'`
  );
  const notM = await prisma.$executeRawUnsafe(
    `UPDATE AppNotification SET message = REPLACE(message, 'MANAM', 'MANAMM') WHERE message LIKE '%MANAM%'`
  );
  console.log(`   Notifications updated: ${notT} titles, ${notM} messages`);

  console.log('=== Database Migration to MANAMM Complete ===');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
