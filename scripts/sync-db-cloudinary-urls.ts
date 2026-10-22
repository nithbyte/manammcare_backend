import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const dataDir = path.resolve('data/products');

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Failed after retries');
}

async function main() {
  console.log('--- Syncing Database with Cloudinary Image URLs ---');

  // 1. Categories
  const categories = loadJson<any[]>('categories.json');
  console.log(`Checking ${categories.length} categories in DB...`);
  for (const c of categories) {
    const targetUrl = c.imageUrl || c.image;
    if (targetUrl) {
      await retry(async () => {
        await prisma.category.updateMany({
          where: { id: c.id, NOT: { imageUrl: targetUrl } },
          data: { imageUrl: targetUrl },
        });
      });
    }
  }
  console.log('Categories synced.');

  // 2. Brands
  const brands = loadJson<any[]>('brands.json');
  console.log(`Checking ${brands.length} brands in DB...`);
  for (const b of brands) {
    if (b.logo) {
      await retry(async () => {
        await prisma.brand.updateMany({
          where: { id: b.id, NOT: { logo: b.logo } },
          data: { logo: b.logo },
        });
      });
    }
  }
  console.log('Brands synced.');

  // 3. Products
  const products = loadJson<any[]>('products.json');
  console.log(`Checking ${products.length} products in DB...`);
  let count = 0;
  for (const p of products) {
    if (p.imageUrl) {
      await retry(async () => {
        const res = await prisma.product.updateMany({
          where: { id: p.id, NOT: { imageUrl: p.imageUrl } },
          data: {
            imageUrl: p.imageUrl,
            thumbnail: p.thumbnail || p.imageUrl,
            images: p.images || [p.imageUrl],
          },
        });
        if (res.count > 0) count++;
      });
    }
  }

  console.log(`Updated ${count} products in database with Cloudinary URLs!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
