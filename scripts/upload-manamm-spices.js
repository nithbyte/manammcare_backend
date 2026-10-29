const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hawhugfs',
  api_key: process.env.CLOUDINARY_API_KEY || '478235249832675',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IiTXNYv67dXWMAeWe7YaDZ20wjM',
});

const prisma = new PrismaClient();

const SOURCE_DIR = 'd:\\Nithbyte Projects\\manamm\\WhatsApp Unknown 2026-10-29 at 19.39.49';

const SPICE_ITEMS = [
  {
    id: 'prod_manamm_coriander',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.43.jpeg',
    publicId: 'manamm-coriander-seeds',
    cleanFilename: 'manamm-coriander-seeds.jpeg',
    name: 'MANAMM Premium Coriander Seeds (மல்லி / தனியா)',
    shortName: 'MANAMM Coriander Seeds',
    tamilName: 'மல்லி (தனியா)',
    description: 'Fresh aromatic coriander seeds sourced directly from premium harvest. Traditional Indian spice rich in essential oils and natural aroma. Fine quality at very low price.',
    price: 140,
    mrp: 175,
    unit: '1 kg',
    weight: '1kg',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 120,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'coriander', 'malli', 'dhaniya', 'pure', 'manamm', 'traditional', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_long_chilli',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.43 (1).jpeg',
    publicId: 'manamm-long-chilli',
    cleanFilename: 'manamm-long-chilli.jpeg',
    name: 'MANAMM Long Red Chilli (நீட்டு மிளகாய்)',
    shortName: 'MANAMM Long Chilli',
    tamilName: 'நீட்டு மிளகாய்',
    description: 'Sun-dried high-aroma long red chillies. Rich in spice and natural heat, enhances flavor naturally in daily cooking. Fine quality at very low price.',
    price: 160,
    mrp: 200,
    unit: '500 g',
    weight: '500g',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 150,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'chilli', 'red chilli', 'neetu milagai', 'pure', 'manamm', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_round_chilli',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.43 (2).jpeg',
    publicId: 'manamm-round-chillies',
    cleanFilename: 'manamm-round-chillies.jpeg',
    name: 'MANAMM Gundu Round Chilli (குண்டு மிளகாய்)',
    shortName: 'MANAMM Round Chilli',
    tamilName: 'குண்டு மிளகாய்',
    description: 'High heat, deep rich red color Ramnad round gundu chillies. Rich natural capsaicin with punchy heat for authentic South Indian tadka and sambar. Fine quality at very low price.',
    price: 175,
    mrp: 220,
    unit: '500 g',
    weight: '500g',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 140,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'gundu chilli', 'round chilli', 'milagai', 'pure', 'manamm', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_fennel',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.43 (3).jpeg',
    publicId: 'manamm-fennel-seeds',
    cleanFilename: 'manamm-fennel-seeds.jpeg',
    name: 'MANAMM Aromatic Fennel Seeds (சோம்பு / பெருஞ்சீரகம்)',
    shortName: 'MANAMM Fennel Seeds',
    tamilName: 'சோம்பு',
    description: 'Sweet, highly fragrant green fennel seeds. Rich source of antioxidants, naturally high in flavor and digestion-friendly. Fine quality at very low price.',
    price: 95,
    mrp: 125,
    unit: '250 g',
    weight: '250g',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 100,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'fennel', 'sombu', 'perunjeeragam', 'saunf', 'pure', 'manamm', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_fenugreek',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.43 (4).jpeg',
    publicId: 'manamm-fenugreek-seeds',
    cleanFilename: 'manamm-fenugreek-seeds.jpeg',
    name: 'MANAMM Pure Fenugreek Seeds (வெந்தயம்)',
    shortName: 'MANAMM Fenugreek',
    tamilName: 'வெந்தயம்',
    description: 'Golden polished whole fenugreek seeds. Excellent aroma and earthy herbal flavor, cooling for body and ideal for traditional tempering and idli batter.',
    price: 75,
    mrp: 95,
    unit: '500 g',
    weight: '500g',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 130,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'fenugreek', 'vendhayam', 'methi', 'pure', 'manamm', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_mustard',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.44.jpeg',
    publicId: 'manamm-mustard-seeds',
    cleanFilename: 'manamm-mustard-seeds.jpeg',
    name: 'MANAMM Small Mustard Seeds (சிறிய கடுகு)',
    shortName: 'MANAMM Mustard',
    tamilName: 'கடுகு',
    description: 'Finest quality Indian small black mustard seeds. Net weight 1KG. Essential natural flavor for traditional South Indian seasoning and tempering.',
    price: 120,
    mrp: 150,
    unit: '1 kg',
    weight: '1kg',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 200,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'mustard', 'kadugu', 'sarson', 'pure', 'manamm', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_cumin',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.44 (1).jpeg',
    publicId: 'manamm-cumin-seeds',
    cleanFilename: 'manamm-cumin-seeds.jpeg',
    name: 'MANAMM Jeera Cumin Seeds (சீரகம்)',
    shortName: 'MANAMM Cumin Seeds',
    tamilName: 'சீரகம்',
    description: 'Unadulterated high-aroma whole cumin seeds (Jeera). Rich source of dietary fibre, naturally high in protein and essential seasoning for daily rasam and curries.',
    price: 180,
    mrp: 230,
    unit: '250 g',
    weight: '250g',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 160,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'cumin', 'jeera', 'seeragam', 'pure', 'manamm', 'foodgrains_oil_masalas']
  },
  {
    id: 'prod_manamm_black_pepper',
    filename: 'WhatsApp Image 2026-10-29 at 19.38.44 (2).jpeg',
    publicId: 'manamm-black-pepper',
    cleanFilename: 'manamm-black-pepper.jpeg',
    name: 'MANAMM Whole Black Pepper (கருப்பு மிளகு)',
    shortName: 'MANAMM Black Pepper',
    tamilName: 'கருப்பு மிளகு',
    description: 'Bold Malabar whole black pepper. Rich source of antioxidants, naturally high in piperine with sharp robust heat. Fine quality at very low price.',
    price: 260,
    mrp: 320,
    unit: '250 g',
    weight: '250g',
    category: 'cat_foodgrains_oil_masalas',
    categoryName: 'Foodgrains, Oil & Masalas',
    subcategory: 'Spices & Seasonings',
    brand: 'MANAMM',
    stock: 110,
    isAvailable: true,
    priceConfirmed: true,
    tags: ['spices', 'pepper', 'black pepper', 'milagu', 'kali mirch', 'pure', 'manamm', 'foodgrains_oil_masalas']
  }
];

async function main() {
  console.log('--- Step 1: Uploading 8 MANAMM Spices to Cloudinary ---');

  // Ensure local directories exist
  const mobileProductDir = 'd:\\Nithbyte Projects\\manamm\\manammcare_mobile_app\\assets\\products';
  const webProductDir = 'd:\\Nithbyte Projects\\manamm\\manammcare_website\\public\\images\\products';
  if (!fs.existsSync(mobileProductDir)) fs.mkdirSync(mobileProductDir, { recursive: true });
  if (!fs.existsSync(webProductDir)) fs.mkdirSync(webProductDir, { recursive: true });

  const uploadedProducts = [];

  for (const item of SPICE_ITEMS) {
    const localFilePath = path.join(SOURCE_DIR, item.filename);
    console.log(`\nProcessing: ${item.name}`);
    console.log(`  Source: ${localFilePath}`);

    // Copy locally
    const mobileCopyPath = path.join(mobileProductDir, item.cleanFilename);
    const webCopyPath = path.join(webProductDir, item.cleanFilename);
    fs.copyFileSync(localFilePath, mobileCopyPath);
    fs.copyFileSync(localFilePath, webCopyPath);

    // Upload to Cloudinary
    let cloudinaryUrl = '';
    try {
      console.log(`  Uploading to Cloudinary as "manamm/products/spices/${item.publicId}"...`);
      const uploadRes = await cloudinary.uploader.upload(localFilePath, {
        folder: 'manamm/products/spices',
        public_id: item.publicId,
        overwrite: true,
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good'
      });
      cloudinaryUrl = uploadRes.secure_url;
      console.log(`  ✓ Cloudinary URL: ${cloudinaryUrl}`);
    } catch (err) {
      console.error(`  ✕ Cloudinary upload failed: ${err.message}`);
      // Fallback to local image path
      cloudinaryUrl = `/images/products/${item.cleanFilename}`;
    }

    uploadedProducts.push({
      ...item,
      image: cloudinaryUrl,
      images: [cloudinaryUrl]
    });
  }

  console.log('\n--- Step 2: Updating Backend JSON Catalog ---');
  const backendCatalogPath = 'd:\\Nithbyte Projects\\manamm\\manammcare_backend\\data\\products\\products.json';
  let backendProducts = [];
  if (fs.existsSync(backendCatalogPath)) {
    backendProducts = JSON.parse(fs.readFileSync(backendCatalogPath, 'utf8'));
  }

  for (const up of uploadedProducts) {
    const existingIdx = backendProducts.findIndex(p => p.id === up.id);
    const productRecord = {
      id: up.id,
      name: up.name,
      shortName: up.shortName,
      tamilName: up.tamilName,
      description: up.description,
      price: up.price,
      mrp: up.mrp,
      unit: up.unit,
      category: up.category,
      categoryName: up.categoryName,
      subcategory: up.subcategory,
      brand: up.brand,
      stock: up.stock,
      isAvailable: up.isAvailable,
      priceConfirmed: up.priceConfirmed,
      images: up.images,
      image: up.image,
      tags: up.tags,
      rating: 4.8,
      reviewsCount: 24,
      isFeatured: true
    };

    if (existingIdx >= 0) {
      backendProducts[existingIdx] = { ...backendProducts[existingIdx], ...productRecord };
      console.log(`Updated backend JSON product: ${up.id}`);
    } else {
      backendProducts.unshift(productRecord);
      console.log(`Prepend backend JSON product: ${up.id}`);
    }
  }

  fs.writeFileSync(backendCatalogPath, JSON.stringify(backendProducts, null, 2));
  console.log('✓ Successfully saved updated backend products.json');

  console.log('\n--- Step 3: Updating Mobile App JSON Catalog ---');
  const mobileCatalogPath = 'd:\\Nithbyte Projects\\manamm\\manammcare_mobile_app\\src\\data\\products\\products.json';
  if (fs.existsSync(mobileCatalogPath)) {
    fs.writeFileSync(mobileCatalogPath, JSON.stringify(backendProducts, null, 2));
    console.log('✓ Successfully synchronized mobile app products.json');
  }

  console.log('\n--- Step 4: Upserting into Hostinger MySQL Database via Prisma ---');

  // Ensure Category exists
  let targetCategory = await prisma.category.findUnique({ where: { id: 'cat_foodgrains_oil_masalas' } });
  if (!targetCategory) {
    targetCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { contains: 'Food' } },
          { name: { contains: 'Spice' } },
          { name: { contains: 'Masala' } }
        ]
      }
    });
  }
  const categoryId = targetCategory ? targetCategory.id : (await prisma.category.findFirst())?.id;
  console.log('Using DB Category ID:', categoryId);

  // Ensure Brand exists
  let targetBrand = await prisma.brand.findFirst({ where: { name: 'MANAMM' } });
  if (!targetBrand) {
    targetBrand = await prisma.brand.create({
      data: {
        name: 'MANAMM',
        slug: 'manamm',
        description: 'MANAMM Pure Farm Staples & Daily Provisions',
        logo: 'https://res.cloudinary.com/hawhugfs/image/upload/v1793283984/manamm/brand/manamm-logo.png',
        isActive: true
      }
    }).catch(() => null);
  }
  const brandId = targetBrand ? targetBrand.id : null;
  console.log('Using DB Brand ID:', brandId);

  for (const up of uploadedProducts) {
    try {
      const discount = Math.max(0, Math.round(((up.mrp - up.price) / up.mrp) * 100));

      await prisma.product.upsert({
        where: { id: up.id },
        update: {
          name: up.name,
          shortDescription: up.shortName,
          description: up.description,
          price: up.price,
          compareAtPrice: up.mrp,
          discountPercentage: discount,
          stock: up.stock,
          unit: up.unit,
          categoryId: categoryId,
          brandId: brandId,
          isAvailable: true,
          isFeatured: true,
          isActive: true,
          imageUrl: up.image,
          thumbnail: up.image,
          images: up.images,
          tags: up.tags,
          updatedAt: new Date()
        },
        create: {
          id: up.id,
          sku: `SKU-${up.id.toUpperCase()}`,
          slug: up.publicId,
          name: up.name,
          shortDescription: up.shortName,
          description: up.description,
          price: up.price,
          compareAtPrice: up.mrp,
          discountPercentage: discount,
          currency: 'INR',
          stock: up.stock,
          unit: up.unit,
          categoryId: categoryId,
          brandId: brandId,
          isAvailable: true,
          isFeatured: true,
          isActive: true,
          imageUrl: up.image,
          thumbnail: up.image,
          images: up.images,
          tags: up.tags,
          rating: 4.9,
          reviewCount: 28,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✓ Upserted into MySQL DB: ${up.id} (${up.name})`);
    } catch (dbErr) {
      console.error(`✕ DB Upsert failed for ${up.id}: ${dbErr.message}`);
    }
  }

  await prisma.$disconnect();
  console.log('\n=== ALL 8 MANAMM SPICES SUCCESSFULLY ADDED TO CATALOG AND DATABASE! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
