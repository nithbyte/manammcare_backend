import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const productsFilePath = path.resolve(__dirname, '../data/products/products.json');

async function main() {
  console.log('--- Starting Sync of Partner Dress Collection to Production MySQL ---');

  if (!fs.existsSync(productsFilePath)) {
    throw new Error(`Products file not found at: ${productsFilePath}`);
  }

  const allProducts: any[] = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));
  const dressProducts = allProducts.filter(
    (p) => (p.id && p.id.startsWith('prod_drs_')) || p.categoryId === 'cat_dresses'
  );

  console.log(`Found ${dressProducts.length} partner dress products in products.json.`);

  // 1. Ensure Brand exists
  console.log('Ensuring brand "brd_partner_collections" exists...');
  await prisma.brand.upsert({
    where: { id: 'brd_partner_collections' },
    update: {
      name: 'MANAMM Partner Studio',
      slug: 'partner-collections',
      description: 'Curated partner collection dresses and artisanal garments.',
      isActive: true,
    },
    create: {
      id: 'brd_partner_collections',
      name: 'MANAMM Partner Studio',
      slug: 'partner-collections',
      description: 'Curated partner collection dresses and artisanal garments.',
      isActive: true,
    },
  });

  // 2. Ensure Category exists
  console.log('Ensuring category "cat_dresses" exists...');
  await prisma.category.upsert({
    where: { id: 'cat_dresses' },
    update: {
      name: 'Dresses',
      slug: 'dresses',
      description: 'Breathable cotton and linen fusion dresses.',
      parentId: 'cat_fashion_lifestyle',
      sortOrder: 0,
      isActive: true,
    },
    create: {
      id: 'cat_dresses',
      name: 'Dresses',
      slug: 'dresses',
      description: 'Breathable cotton and linen fusion dresses.',
      parentId: 'cat_fashion_lifestyle',
      sortOrder: 0,
      isActive: true,
    },
  });

  // 3. Upsert Dress Products
  console.log(`Upserting ${dressProducts.length} dresses...`);
  let successCount = 0;

  for (const p of dressProducts) {
    const img = p.imageUrl || (Array.isArray(p.images) && p.images[0]) || '';
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [img];
    const thumbnail = p.thumbnail || img;

    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        sku: p.sku || null,
        slug: p.slug || null,
        name: p.name,
        shortDescription: p.shortDescription || null,
        description: p.description || p.name,
        categoryId: p.categoryId || 'cat_dresses',
        brandId: 'brd_partner_collections',
        price: Number(p.price) || 300,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : 599,
        discountPercentage: p.discountPercentage || 50,
        currency: p.currency || 'INR',
        stock: p.stock ?? 60,
        isAvailable: p.isAvailable ?? true,
        isFeatured: p.isFeatured ?? true,
        isActive: p.isActive ?? true,
        imageUrl: img,
        images,
        thumbnail,
        attributes: p.attributes || [],
        tags: p.tags || [],
        rating: p.rating ?? 4.8,
        reviewCount: p.reviewCount ?? 15,
        unit: p.unit || '1 Piece',
      },
      create: {
        id: p.id,
        sku: p.sku || null,
        slug: p.slug || null,
        name: p.name,
        shortDescription: p.shortDescription || null,
        description: p.description || p.name,
        categoryId: p.categoryId || 'cat_dresses',
        brandId: 'brd_partner_collections',
        price: Number(p.price) || 300,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : 599,
        discountPercentage: p.discountPercentage || 50,
        currency: p.currency || 'INR',
        stock: p.stock ?? 60,
        isAvailable: p.isAvailable ?? true,
        isFeatured: p.isFeatured ?? true,
        isActive: p.isActive ?? true,
        imageUrl: img,
        images,
        thumbnail,
        attributes: p.attributes || [],
        tags: p.tags || [],
        rating: p.rating ?? 4.8,
        reviewCount: p.reviewCount ?? 15,
        unit: p.unit || '1 Piece',
      },
    });

    successCount++;
  }

  console.log(`✅ Successfully synced ${successCount} partner dresses to database!`);
}

main()
  .catch((e) => {
    console.error('❌ Error syncing dresses:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
