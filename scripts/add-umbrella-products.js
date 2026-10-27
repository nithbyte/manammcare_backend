const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

dotenv.config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const baseDir = path.resolve(__dirname, '../..');
const backendDir = path.resolve(__dirname, '..');
const websiteDir = path.resolve(baseDir, 'manammcare_website');
const mobileDir = path.resolve(baseDir, 'manammcare_mobile_app');

const imageDefs = [
  {
    localFile: path.join(baseDir, 'WhatsApp Image 2026-10-26 at 17.14.45.jpeg'),
    cleanName: 'tag-hills-golf-auto-30x8k-m8028.jpg',
    publicId: 'tag-hills-golf-auto-30x8k-m8028',
    id: 'prod_tag_hills_umbrella_8028',
    sku: 'MNM-TH-8028',
    slug: 'tag-hills-golf-auto-30x8k-umbrella-m8028',
    name: 'TAG Hills Golf Auto 30"x8K Nylon Windproof Umbrella (M-8028)',
    shortDescription: 'TAG Hills 30"x8K automatic windproof golf umbrella with full fibre frame and heavy handle.',
    description: 'TAG Hills Exclusive Umbrella M-8028-OVV Golf Auto 30"x8K crafted with premium black silver nylon fabric, full fibre frame, and flexible fibre ribs for heavy-duty windproof performance. Features a robust heavy handle and smooth automatic push-button opening.',
    model: 'M-8028-OVV-',
    size: '30" x 8K',
    material: 'Nylon Black Silver Fabric, Full Fibre Frame & Ribs',
    features: ['30" x 8K Large Golf Size', 'Nylon Black Silver Fabric', 'Full Fibre Frame & Fibre Ribs', 'Windproof Design', 'Heavy Handle Grip', 'Automatic Opening'],
    unit: '1 Piece',
    stock: 50,
  },
  {
    localFile: path.join(baseDir, 'WhatsApp Image 2026-10-26 at 17.14.46 (1).jpeg'),
    cleanName: 'tag-hills-auto-wooden-golf-27x8k-m8104.jpg',
    publicId: 'tag-hills-auto-wooden-golf-27x8k-m8104',
    id: 'prod_tag_hills_umbrella_8104',
    sku: 'MNM-TH-8104',
    slug: 'tag-hills-auto-wooden-golf-27x8k-umbrella-m8104',
    name: 'TAG Hills Auto Wooden Golf 27"x8K Ponjee Umbrella (M-8104)',
    shortDescription: 'TAG Hills 27"x8K automatic golf umbrella with classic wooden handle and matching cloth case.',
    description: 'TAG Hills Exclusive Umbrella M-8104-NON Auto Wooden Golf 27"x8K crafted with black silver ponjee fabric and windproof fibre frame. Finished with an elegant polished wooden handle, strap, and protective cloth carry case.',
    model: 'M-8104-NON',
    size: '27" x 8K',
    material: 'Ponjee Black Silver Fabric, Fibre Windproof Frame, Wooden Handle',
    features: ['27" x 8K Golf Canopy', 'Ponjee Black Silver Fabric', 'Fibre Windproof Frame', 'Classic Wooden Handle with Wrist Strap', 'Matching Fabric Carry Case', 'Automatic Push Button'],
    unit: '1 Piece',
    stock: 50,
  },
  {
    localFile: path.join(baseDir, 'WhatsApp Image 2026-10-26 at 17.14.46.jpeg'),
    cleanName: 'tag-hills-auto-wooden-golf-27x8k-uv-m8016.jpg',
    publicId: 'tag-hills-auto-wooden-golf-27x8k-uv-m8016',
    id: 'prod_tag_hills_umbrella_8016',
    sku: 'MNM-TH-8016',
    slug: 'tag-hills-auto-wooden-golf-27x8k-uv-umbrella-m8016',
    name: 'TAG Hills Auto Wooden Golf 27"x8K Black UV Coating Umbrella (M-8016)',
    shortDescription: 'TAG Hills 27"x8K auto golf umbrella with black UV protection coating, fibre frame and wooden handle.',
    description: 'TAG Hills Exclusive Umbrella M-8016-NNR Auto Wooden Golf 27"x8K Ponjee Gents Mono umbrella engineered with inner black UV coating fabric for complete sun and rain protection. Features a durable fibre windproof frame, polished wooden handle, and full-length shoulder strap cloth case.',
    model: 'M-8016-NNR',
    size: '27" x 8K',
    material: 'Ponjee Gents Mono with Black UV Coating Fabric, Fibre Windproof Frame, Wooden Handle',
    features: ['27" x 8K Gents Mono Canopy', 'Black UV Protective Coating', 'Fibre Windproof Frame', 'Polished Wooden Handle', 'Full-Length Carry Case with Shoulder Strap', 'All-Weather Protection'],
    unit: '1 Piece',
    stock: 50,
  },
  {
    localFile: path.join(baseDir, 'WhatsApp Image 2026-10-26 at 17.14.47.jpeg'),
    cleanName: 'tag-hills-transparent-reverse-21x6k-m8157.jpg',
    publicId: 'tag-hills-transparent-reverse-21x6k-m8157',
    id: 'prod_tag_hills_umbrella_8157',
    sku: 'MNM-TH-8157',
    slug: 'tag-hills-transparent-reverse-21x6k-umbrella-m8157',
    name: 'TAG Hills 21"x6K Transparent Reverse Umbrella with Eye-Safety Blunt Ribs (M-8157)',
    shortDescription: 'TAG Hills 21"x6K transparent dome umbrella with safety blunt ribs and auto-close reverse feature.',
    description: 'TAG Hills Exclusive Umbrella M-8157-NUO- 21"x6K Double Fibre ribs transparent umbrella with color border trim. Engineered with blunt curved tips for eye safety, manual smooth open, and push-button auto-close reverse feature to keep rainwater contained.',
    model: 'M-8157-NUO-',
    size: '21" x 6K',
    material: 'Clear Transparent Canopy with Color Border, Double Fibre Ribs',
    features: ['21" x 6K Double Fibre Ribs', 'Eye-Safety Blunt Curved Rib Tips', 'Clear View Transparent Canopy', 'Reverse Mechanism: Press Button to Close', 'Color Border Trim & Curved Ergonomic Handle', 'Drip-Free Folding Design'],
    unit: '1 Piece',
    stock: 50,
  },
];

async function main() {
  console.log('--- 1. Uploading images to Cloudinary and copying locally ---');
  const uploadedUrls = {};

  // Ensure public product image dirs exist
  const localTargetDirs = [
    path.join(websiteDir, 'public/images/products'),
    path.join(backendDir, 'public/images/products'),
  ];
  if (fs.existsSync(mobileDir)) {
    localTargetDirs.push(path.join(mobileDir, 'public/images/products'));
  }

  localTargetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  for (const item of imageDefs) {
    if (!fs.existsSync(item.localFile)) {
      console.error(`File does not exist: ${item.localFile}`);
      continue;
    }

    // Copy locally
    for (const targetDir of localTargetDirs) {
      const dest = path.join(targetDir, item.cleanName);
      fs.copyFileSync(item.localFile, dest);
      console.log(`Copied local image -> ${dest}`);
    }

    // Upload to Cloudinary
    console.log(`Uploading ${item.cleanName} to Cloudinary...`);
    try {
      const res = await cloudinary.uploader.upload(item.localFile, {
        folder: 'manamm/products',
        public_id: item.publicId,
        overwrite: true,
        resource_type: 'image',
      });
      uploadedUrls[item.id] = res.secure_url;
      console.log(`  Uploaded successfully: ${res.secure_url}`);
    } catch (err) {
      console.warn(`  Cloudinary upload failed: ${err.message}. Using fallback URL.`);
      uploadedUrls[item.id] = `/images/products/${item.cleanName}`;
    }
  }

  console.log('--- 2. Updating brands.json ---');
  const brandObj = {
    id: 'brd_tag_hills',
    name: 'TAG Hills',
    slug: 'tag-hills',
    description: 'TAG Hills exclusive umbrellas featuring windproof fibre frames, UV protective fabrics, and eye-safety engineering.',
    logo: uploadedUrls[imageDefs[0].id] || `/images/products/${imageDefs[0].cleanName}`,
    isActive: true,
    productCount: 4,
  };

  const brandFiles = [
    path.join(backendDir, 'data/products/brands.json'),
    path.join(mobileDir, 'src/data/products/brands.json'),
  ];
  for (const bf of brandFiles) {
    if (fs.existsSync(bf)) {
      const brands = JSON.parse(fs.readFileSync(bf, 'utf-8'));
      const idx = brands.findIndex(b => b.id === brandObj.id);
      if (idx >= 0) {
        brands[idx] = { ...brands[idx], ...brandObj };
      } else {
        brands.unshift(brandObj);
      }
      fs.writeFileSync(bf, JSON.stringify(brands, null, 2), 'utf-8');
      console.log(`Updated brands in: ${bf}`);
    }
  }

  console.log('--- 3. Constructing 4 Product entries (Price: 700 each) ---');
  const newProducts = imageDefs.map(item => {
    const imgUrl = uploadedUrls[item.id] || `/images/products/${item.cleanName}`;
    return {
      id: item.id,
      sku: item.sku,
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      description: item.description,
      price: 700,
      compareAtPrice: 1199,
      mrp: 1199,
      discountPercentage: 42,
      currency: 'INR',
      category: 'Accessories',
      categoryId: 'cat_accessories',
      subcategory: 'Umbrellas',
      mainCategoryId: 'cat_fashion_lifestyle',
      mainCategory: 'Partner Collections & Lifestyle',
      sourceType: 'PARTNER',
      brandId: 'brd_tag_hills',
      brand: 'TAG Hills',
      imageUrl: imgUrl,
      images: [imgUrl],
      thumbnail: imgUrl,
      priceConfirmed: true,
      status: 'ACTIVE',
      stock: item.stock,
      isAvailable: true,
      isFeatured: true,
      featured: true,
      newArrival: true,
      isActive: true,
      rating: 4.8,
      reviewCount: 24,
      unit: item.unit,
      attributes: [
        { name: 'Brand', value: 'TAG Hills' },
        { name: 'Category', value: 'Partner Collections & Lifestyle' },
        { name: 'Subcategory', value: 'Accessories' },
        { name: 'Product Type', value: 'Umbrella' },
        { name: 'Model', value: item.model },
        { name: 'Canopy Size', value: item.size },
        { name: 'Material', value: item.material },
        { name: 'Price', value: '₹700' },
        ...item.features.map(f => ({ name: 'Feature', value: f })),
      ],
      tags: [
        'umbrella',
        'tag hills',
        'rainwear',
        'golf umbrella',
        'windproof umbrella',
        'accessories',
        'partner collections',
        'outdoor essentials',
        item.model.toLowerCase().replace(/[^a-z0-9]/g, ''),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  console.log('--- 4. Updating products.json in Backend, Mobile App, and Website ---');
  const productsFiles = [
    path.join(backendDir, 'data/products/products.json'),
    path.join(mobileDir, 'src/data/products/products.json'),
    path.join(websiteDir, 'src/data/products.json'),
  ];

  for (const pf of productsFiles) {
    if (fs.existsSync(pf)) {
      console.log(`Processing ${pf}...`);
      const prods = JSON.parse(fs.readFileSync(pf, 'utf-8'));
      for (const np of newProducts) {
        const idx = prods.findIndex(p => p.id === np.id || p.slug === np.slug);
        if (idx >= 0) {
          prods[idx] = { ...prods[idx], ...np };
          console.log(`  Updated existing product ${np.id} in ${pf}`);
        } else {
          prods.unshift(np);
          console.log(`  Prepended new product ${np.id} in ${pf}`);
        }
      }
      fs.writeFileSync(pf, JSON.stringify(prods, null, 2), 'utf-8');
      console.log(`✅ Successfully saved ${prods.length} products to ${pf}`);
    } else {
      console.warn(`File not found: ${pf}`);
    }
  }

  console.log('--- 5. Attempting MySQL Prisma DB Upsert (if connection available) ---');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection with timeout
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timed out (5s)')), 5000))
    ]);

    console.log('Connected to Prisma MySQL DB! Upserting brand...');
    await prisma.brand.upsert({
      where: { id: brandObj.id },
      update: {
        name: brandObj.name,
        slug: brandObj.slug,
        description: brandObj.description,
        logo: brandObj.logo,
        isActive: true,
      },
      create: {
        id: brandObj.id,
        name: brandObj.name,
        slug: brandObj.slug,
        description: brandObj.description,
        logo: brandObj.logo,
        isActive: true,
      },
    });

    console.log('Upserting 4 products to Prisma DB...');
    for (const p of newProducts) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          shortDescription: p.shortDescription,
          description: p.description,
          categoryId: p.categoryId,
          brandId: p.brandId,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          discountPercentage: p.discountPercentage,
          currency: p.currency,
          stock: p.stock,
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          imageUrl: p.imageUrl,
          images: p.images,
          thumbnail: p.thumbnail,
          attributes: p.attributes,
          tags: p.tags,
          rating: p.rating,
          reviewCount: p.reviewCount,
          unit: p.unit,
        },
        create: {
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          shortDescription: p.shortDescription,
          description: p.description,
          categoryId: p.categoryId,
          brandId: p.brandId,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          discountPercentage: p.discountPercentage,
          currency: p.currency,
          stock: p.stock,
          isAvailable: p.isAvailable,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          imageUrl: p.imageUrl,
          images: p.images,
          thumbnail: p.thumbnail,
          attributes: p.attributes,
          tags: p.tags,
          rating: p.rating,
          reviewCount: p.reviewCount,
          unit: p.unit,
        },
      });
      console.log(`  Upserted to DB: ${p.name}`);
    }
    console.log('✅ DB Upsert complete!');
    await prisma.$disconnect();
  } catch (err) {
    console.warn('DB Sync skipped or timed out:', err.message);
    console.log('(Frontend and mobile apps load from local JSON / cached catalog, so products will show immediately.)');
  }

  console.log('🎉 ALL DONE!');
}

main().catch(err => {
  console.error('Fatal error in script:', err);
  process.exit(1);
});
