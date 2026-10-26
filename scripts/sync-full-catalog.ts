import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const dataDir = path.resolve(__dirname, '../data/products');

function loadJson<T>(filename: string): T {
  const filePath = path.join(dataDir, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function formatBackendImageUrl(url?: string | null): string {
  if (!url) return 'https://manammcare.com/images/products/daily-care.webp';
  let clean = url.replace(/https:\/\/manammcare\.comhttps:\/\/manammcare\.com/g, 'https://manammcare.com');
  if (clean.includes('/uploads/products/')) {
    const filename = clean.split('/uploads/products/').pop();
    return `https://manammcare.com/images/products/${filename}`;
  }
  if (clean.startsWith('/images/products/')) {
    const filename = clean.replace('/images/products/', '');
    return `https://manammcare.com/images/products/${filename}`;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('api.manammcare.com/uploads/products/')) {
      const filename = clean.split('api.manammcare.com/uploads/products/').pop();
      return `https://manammcare.com/images/products/${filename}`;
    }
    return clean;
  }
  return clean;
}

async function main() {
  console.log('--- Starting Complete Catalog Sync to Production MySQL ---');

  // 1. Categories
  const categories = loadJson<any[]>('categories.json');
  const existingCatMap = new Map((await prisma.category.findMany({ select: { id: true, slug: true } })).map(c => [c.id, c.slug]));
  const seenCatSlugs = new Set<string>(Array.from(existingCatMap.values()));

  const missingCategories = categories.filter(c => !existingCatMap.has(c.id));
  console.log(`Found ${missingCategories.length} missing categories to insert...`);

  for (const cat of missingCategories) {
    let slug = cat.slug || cat.id;
    if (seenCatSlugs.has(slug)) {
      slug = `${slug}-${cat.id}`;
    }
    seenCatSlugs.add(slug);

    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug,
        description: cat.description || null,
        imageUrl: formatBackendImageUrl(cat.imageUrl || cat.image),
        icon: cat.icon || 'grid',
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive ?? true,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug,
        description: cat.description || null,
        imageUrl: formatBackendImageUrl(cat.imageUrl || cat.image),
        icon: cat.icon || 'grid',
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive ?? true,
      },
    });
  }
  console.log('✅ Categories synced.');

  // 2. Brands
  const brands = loadJson<any[]>('brands.json');
  const existingBrandMap = new Map((await prisma.brand.findMany({ select: { id: true, slug: true } })).map(b => [b.id, b.slug]));
  const seenBrandSlugs = new Set<string>(Array.from(existingBrandMap.values()));
  const missingBrands = brands.filter(b => !existingBrandMap.has(b.id));
  console.log(`Found ${missingBrands.length} missing brands to insert...`);
  for (const brand of missingBrands) {
    let slug = brand.slug || brand.id;
    if (seenBrandSlugs.has(slug)) {
      slug = `${slug}-${brand.id}`;
    }
    seenBrandSlugs.add(slug);

    await prisma.brand.upsert({
      where: { id: brand.id },
      update: {
        name: brand.name,
        slug,
        description: brand.description || null,
        logo: brand.logo || null,
        isActive: brand.isActive ?? true,
      },
      create: {
        id: brand.id,
        name: brand.name,
        slug,
        description: brand.description || null,
        logo: brand.logo || null,
        isActive: brand.isActive ?? true,
      },
    });
  }
  // Ensure partner brand
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
  console.log('✅ Brands synced.');

  // 3. Products
  const validCategories = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));
  const validBrands = new Set((await prisma.brand.findMany({ select: { id: true } })).map((b) => b.id));

  const products = loadJson<any[]>('products.json');
  console.log(`Preparing ${products.length} products for batch insertion...`);

  const productRows: any[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenSkus = new Set<string>();

  // Fetch already existing IDs, Slugs, and SKUs from DB to prevent unique constraint collisions
  const existingInDb = await prisma.product.findMany({
    select: { id: true, slug: true, sku: true },
  });
  existingInDb.forEach((p) => {
    if (p.id) seenIds.add(p.id);
    if (p.slug) seenSlugs.add(p.slug.toLowerCase());
    if (p.sku) seenSkus.add(p.sku.toUpperCase());
  });

  for (const p of products) {
    if (!p.id || seenIds.has(p.id)) continue;
    seenIds.add(p.id);

    // Validate category
    let categoryId = p.categoryId || 'cat_household_accessories';
    if (!validCategories.has(categoryId)) {
      categoryId = 'cat_household_accessories';
    }

    // Validate brand
    let brandId = p.brandId || null;
    if (brandId && !validBrands.has(brandId)) {
      brandId = null;
    }

    // Unique slug
    let slug = p.slug || p.id;
    if (seenSlugs.has(slug.toLowerCase())) {
      slug = `${slug}-${p.id}`;
    }
    seenSlugs.add(slug.toLowerCase());

    // Unique sku
    let sku = p.sku || null;
    if (sku && seenSkus.has(sku.toUpperCase())) {
      sku = `${sku}-${p.id}`;
    }
    if (sku) seenSkus.add(sku.toUpperCase());

    const img = formatBackendImageUrl(p.imageUrl);
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images.map((im: string) => formatBackendImageUrl(im))
      : [img];
    const thumbnail = formatBackendImageUrl(p.thumbnail || p.imageUrl);

    productRows.push({
      id: p.id,
      sku,
      slug,
      name: p.name,
      shortDescription: p.shortDescription || null,
      description: p.description || p.name,
      categoryId,
      brandId,
      price: Number(p.price) || 99,
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      discountPercentage: p.discountPercentage || 0,
      currency: p.currency || 'INR',
      stock: p.stock ?? 25,
      isAvailable: p.isAvailable ?? true,
      isFeatured: p.isFeatured ?? false,
      isActive: p.isActive ?? true,
      imageUrl: img,
      images,
      thumbnail,
      attributes: p.attributes || [],
      tags: p.tags || [],
      rating: Number(p.rating ?? 4.8),
      reviewCount: p.reviewCount ?? 0,
      unit: p.unit || '1 Unit',
    });
  }

  console.log(`Inserting ${productRows.length} new products in chunks of 500...`);
  const chunkSize = 500;
  for (let i = 0; i < productRows.length; i += chunkSize) {
    const chunk = productRows.slice(i, i + chunkSize);
    const result = await prisma.product.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`Chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(productRows.length / chunkSize)}: inserted ${result.count} products`);
  }

  const finalCount = await prisma.product.count();
  console.log(`🎉 Finished! Total products in database: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error syncing catalog:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
