import { PrismaClient, Role, UserStatus, AddressType, CouponType, BannerActionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const mobileDataDir = path.resolve(__dirname, '../../manammcare_mobile_app/src/data');

function loadJson<T>(relativePath: string): T {
  const filePath = path.join(mobileDataDir, relativePath);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [] as unknown as T;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

async function main() {
  console.log('--- Starting MANAM Database Seeding ---');

  // 1. Seed Categories
  const categoriesData = loadJson<any[]>('products/categories.json');
  console.log(`Seeding ${categoriesData.length} categories...`);
  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        imageUrl: cat.imageUrl || cat.image || null,
        icon: cat.icon || 'grid',
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
        sortOrder: cat.sortOrder || 0,
        isActive: cat.isActive ?? true,
      },
    });
  }

  // 2. Seed Brands
  const brandsData = loadJson<any[]>('products/brands.json');
  console.log(`Seeding ${brandsData.length} brands...`);
  for (const brand of brandsData) {
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

  // 3. Seed Users
  const usersData = loadJson<any[]>('users/users.json');
  console.log(`Seeding ${usersData.length} users...`);
  const defaultCustomerPasswordHash = await bcrypt.hash('Customer@123', 10);
  const defaultAdminPasswordHash = await bcrypt.hash('Admin@1234', 10);

  for (const u of usersData) {
    const isAdmin = u.role === 'ADMIN' || u.role === 'admin';
    const password = isAdmin ? defaultAdminPasswordHash : defaultCustomerPasswordHash;

    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        email: u.email.toLowerCase(),
        phone: u.phone || null,
        fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        role: isAdmin ? Role.ADMIN : Role.CUSTOMER,
        status: (u.status as UserStatus) || UserStatus.ACTIVE,
        profileImage: u.profileImage || u.avatarUrl || null,
      },
      create: {
        id: u.id,
        email: u.email.toLowerCase(),
        phone: u.phone || null,
        password,
        fullName: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        role: isAdmin ? Role.ADMIN : Role.CUSTOMER,
        status: (u.status as UserStatus) || UserStatus.ACTIVE,
        profileImage: u.profileImage || u.avatarUrl || null,
      },
    });
  }

  // 4. Seed User Profiles & Addresses
  const addressesData = loadJson<any[]>('users/addresses.json');
  console.log(`Seeding ${addressesData.length} addresses...`);
  for (const addr of addressesData) {
    await prisma.address.upsert({
      where: { id: addr.id },
      update: {
        userId: addr.userId,
        type: (addr.type?.toUpperCase() as AddressType) || AddressType.HOME,
        name: addr.name || addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || null,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country || 'India',
        landmark: addr.landmark || null,
        isDefault: addr.isDefault ?? false,
      },
      create: {
        id: addr.id,
        userId: addr.userId,
        type: (addr.type?.toUpperCase() as AddressType) || AddressType.HOME,
        name: addr.name || addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || null,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country || 'India',
        landmark: addr.landmark || null,
        isDefault: addr.isDefault ?? false,
      },
    });
  }

  // 5. Seed Products
  const productsData = loadJson<any[]>('products/products.json');
  console.log(`Seeding ${productsData.length} products...`);
  for (const p of productsData) {
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
        stock: p.stock ?? 10,
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
        stock: p.stock ?? 10,
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

  // 6. Seed Product Variants
  const variantsData = loadJson<any[]>('products/product-variants.json');
  console.log(`Seeding ${variantsData.length} product variants...`);
  for (const v of variantsData) {
    await prisma.productVariant.upsert({
      where: { id: v.id },
      update: {
        productId: v.productId,
        sku: v.sku,
        title: v.title,
        packSize: v.packSize,
        price: v.price,
        compareAtPrice: v.compareAtPrice || null,
        stock: v.stock ?? 10,
        isAvailable: v.isAvailable ?? true,
        attributes: v.attributes || null,
      },
      create: {
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        title: v.title,
        packSize: v.packSize,
        price: v.price,
        compareAtPrice: v.compareAtPrice || null,
        stock: v.stock ?? 10,
        isAvailable: v.isAvailable ?? true,
        attributes: v.attributes || null,
      },
    });
  }

  // 7. Seed Coupons
  const couponsData = loadJson<any[]>('commerce/coupons.json');
  console.log(`Seeding ${couponsData.length} coupons...`);
  for (const c of couponsData) {
    await prisma.coupon.upsert({
      where: { id: c.id },
      update: {
        code: c.code.toUpperCase(),
        title: c.title,
        description: c.description || null,
        type: (c.type as CouponType) || CouponType.PERCENTAGE,
        value: c.value,
        minimumOrderValue: c.minimumOrderValue || 0,
        maximumDiscount: c.maximumDiscount || null,
        usageLimit: c.usageLimit || 100,
        usedCount: c.usedCount || 0,
        startDate: new Date(c.startDate || Date.now()),
        endDate: new Date(c.endDate || '2026-12-31'),
        isActive: c.isActive ?? true,
      },
      create: {
        id: c.id,
        code: c.code.toUpperCase(),
        title: c.title,
        description: c.description || null,
        type: (c.type as CouponType) || CouponType.PERCENTAGE,
        value: c.value,
        minimumOrderValue: c.minimumOrderValue || 0,
        maximumDiscount: c.maximumDiscount || null,
        usageLimit: c.usageLimit || 100,
        usedCount: c.usedCount || 0,
        startDate: new Date(c.startDate || Date.now()),
        endDate: new Date(c.endDate || '2026-12-31'),
        isActive: c.isActive ?? true,
      },
    });
  }

  // 8. Seed Content (Banners, FAQs, Policies)
  const bannersData = loadJson<any[]>('content/banners.json');
  console.log(`Seeding ${bannersData.length} banners...`);
  for (const b of bannersData) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        subtitle: b.subtitle || null,
        image: b.image,
        actionType: (b.actionType as BannerActionType) || BannerActionType.NONE,
        actionValue: b.actionValue || null,
        sortOrder: b.sortOrder || 0,
        isActive: b.isActive ?? true,
      },
      create: {
        id: b.id,
        title: b.title,
        subtitle: b.subtitle || null,
        image: b.image,
        actionType: (b.actionType as BannerActionType) || BannerActionType.NONE,
        actionValue: b.actionValue || null,
        sortOrder: b.sortOrder || 0,
        isActive: b.isActive ?? true,
      },
    });
  }

  const faqsData = loadJson<any[]>('content/faqs.json');
  console.log(`Seeding ${faqsData.length} FAQs...`);
  for (const f of faqsData) {
    await prisma.fAQ.upsert({
      where: { id: f.id },
      update: {
        question: f.question,
        answer: f.answer,
        category: f.category || 'General',
        sortOrder: f.sortOrder || 0,
        isActive: f.isActive ?? true,
      },
      create: {
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category || 'General',
        sortOrder: f.sortOrder || 0,
        isActive: f.isActive ?? true,
      },
    });
  }

  const policiesData = loadJson<any[]>('content/policies.json');
  console.log(`Seeding ${policiesData.length} policies...`);
  for (const pol of policiesData) {
    await prisma.policy.upsert({
      where: { id: pol.id },
      update: {
        slug: pol.slug,
        title: pol.title,
        content: pol.content,
        version: pol.version || '1.0',
      },
      create: {
        id: pol.id,
        slug: pol.slug,
        title: pol.title,
        content: pol.content,
        version: pol.version || '1.0',
      },
    });
  }

  console.log('--- MANAM Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
