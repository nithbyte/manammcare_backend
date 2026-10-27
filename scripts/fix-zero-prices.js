const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const productsFilePath = path.resolve(__dirname, '../data/products/products.json');

async function main() {
  console.log('--- Fixing Zero Prices in MySQL Database ---');
  const prods = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));
  const prodMap = new Map(prods.map(p => [p.id, p]));

  const zeroList = await prisma.product.findMany({
    where: { price: 0 },
  });

  console.log(`Found ${zeroList.length} products with price 0 in DB.`);

  let updatedCount = 0;
  for (const zp of zeroList) {
    const jsonP = prodMap.get(zp.id) || prods.find(p => p.slug === zp.slug);
    if (jsonP && Number(jsonP.price) > 0) {
      const price = Number(jsonP.price);
      const compareAtPrice = jsonP.compareAtPrice ? Number(jsonP.compareAtPrice) : null;
      const discountPercentage = jsonP.discountPercentage ? Number(jsonP.discountPercentage) : 0;

      await prisma.product.update({
        where: { id: zp.id },
        data: {
          price,
          compareAtPrice,
          discountPercentage,
        },
      });

      console.log(`✅ Updated ${zp.name} (${zp.slug}): ₹${price} (MRP: ₹${compareAtPrice})`);
      updatedCount++;
    } else {
      console.warn(`⚠️ No price found in JSON for ${zp.id} (${zp.name})`);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} products in the database!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
