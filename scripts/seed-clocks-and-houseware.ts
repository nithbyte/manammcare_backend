import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const mobileDataDir = fs.existsSync(path.resolve(__dirname, '../../manamm_app/src/data'))
  ? path.resolve(__dirname, '../../manamm_app/src/data')
  : path.resolve(__dirname, '../../manammcare_mobile_app/src/data');

function loadJson<T>(relativePath: string): T {
  const filePath = path.join(mobileDataDir, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

async function main() {
  console.log('--- Seeding Clocks & Novelties and Food n Food Houseware into DB ---');

  // 1. Seed Categories
  const categories = loadJson<any[]>('products/categories.json');
  console.log(`Upserting ${categories.length} categories...`);
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        imageUrl: cat.imageUrl || cat.image || null,
        icon: cat.icon || 'grid',
        parentId: cat.parentId || null,
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive ?? true,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        imageUrl: cat.imageUrl || cat.image || null,
        icon: cat.icon || 'grid',
        parentId: cat.parentId || null,
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive ?? true,
      },
    });
  }

  // 2. Seed Brands
  const brands = loadJson<any[]>('products/brands.json');
  console.log(`Upserting ${brands.length} brands...`);
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { id: brand.id },
      update: {
        name: brand.name,
        slug: brand.slug,
        description: brand.description || null,
        logo: brand.logo || null,
        isActive: brand.isActive ?? true,
      },
      create: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description || null,
        logo: brand.logo || null,
        isActive: brand.isActive ?? true,
      },
    });
  }

  // 3. Seed Products
  const products = loadJson<any[]>('products/products.json');
  console.log(`Upserting ${products.length} products...`);
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        sku: p.sku || null,
        slug: p.slug || null,
        name: p.name,
        shortDescription: p.shortDescription || null,
        description: p.description,
        categoryId: p.categoryId,
        brandId: p.brandId || null,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        discountPercentage: p.discountPercentage || 0,
        currency: p.currency || 'INR',
        stock: p.stock ?? 50,
        isAvailable: p.isAvailable ?? true,
        isFeatured: p.isFeatured ?? false,
        isActive: p.isActive ?? true,
        imageUrl: p.imageUrl,
        images: p.images || [],
        thumbnail: p.thumbnail || null,
        attributes: p.attributes || [],
        tags: p.tags || [],
        rating: p.rating ?? 5.0,
        reviewCount: p.reviewCount ?? 0,
        unit: p.unit || '1 Unit',
      },
      create: {
        id: p.id,
        sku: p.sku || null,
        slug: p.slug || null,
        name: p.name,
        shortDescription: p.shortDescription || null,
        description: p.description,
        categoryId: p.categoryId,
        brandId: p.brandId || null,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        discountPercentage: p.discountPercentage || 0,
        currency: p.currency || 'INR',
        stock: p.stock ?? 50,
        isAvailable: p.isAvailable ?? true,
        isFeatured: p.isFeatured ?? false,
        isActive: p.isActive ?? true,
        imageUrl: p.imageUrl,
        images: p.images || [],
        thumbnail: p.thumbnail || null,
        attributes: p.attributes || [],
        tags: p.tags || [],
        rating: p.rating ?? 5.0,
        reviewCount: p.reviewCount ?? 0,
        unit: p.unit || '1 Unit',
      },
    });
  }

  console.log('--- Successfully Seeded Clocks, Novelties & Houseware into DB ---');
}

main()
  .catch((e) => {
    console.error('Error seeding DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
