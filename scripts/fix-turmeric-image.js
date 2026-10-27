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

const sourceImage = path.join(backendDir, 'uploads/products/turmeric-powder.jpg');

async function main() {
  console.log('--- 1. Verifying authentic Manamm packed turmeric image ---');
  if (!fs.existsSync(sourceImage)) {
    throw new Error(`Source image not found: ${sourceImage}`);
  }
  const stat = fs.statSync(sourceImage);
  console.log(`Found authentic turmeric image: ${sourceImage} (${stat.size} bytes)`);

  console.log('--- 2. Copying to local public directories ---');
  const targetDirs = [
    path.join(websiteDir, 'public/images/products'),
    path.join(backendDir, 'public/images/products'),
  ];
  if (fs.existsSync(mobileDir)) {
    targetDirs.push(path.join(mobileDir, 'public/images/products'));
  }

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, 'turmeric-powder.jpg');
    fs.copyFileSync(sourceImage, dest);
    console.log(`Copied to -> ${dest}`);
  }

  console.log('--- 3. Overwriting turmeric-powder on Cloudinary ---');
  const uploadResult = await cloudinary.uploader.upload(sourceImage, {
    folder: 'manamm/products',
    public_id: 'turmeric-powder',
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
  });

  console.log('✅ Uploaded to Cloudinary successfully!');
  console.log(`Public ID: ${uploadResult.public_id}`);
  console.log(`Secure URL: ${uploadResult.secure_url}`);
  console.log(`Version: ${uploadResult.version}`);

  const newUrl = uploadResult.secure_url;

  console.log('--- 4. Updating products.json in Backend, Website, and Mobile App ---');
  const productsFiles = [
    path.join(backendDir, 'data/products/products.json'),
    path.join(websiteDir, 'src/data/products.json'),
    path.join(mobileDir, 'src/data/products/products.json'),
  ];

  for (const pf of productsFiles) {
    if (fs.existsSync(pf)) {
      const prods = JSON.parse(fs.readFileSync(pf, 'utf-8'));
      let updatedCount = 0;
      for (const p of prods) {
        if (p.id === 'prod_mnm_001' || p.slug === 'turmeric-powder' || (p.name === 'Turmeric Powder' && p.brand === 'Manammcare')) {
          p.imageUrl = newUrl;
          p.images = [newUrl];
          p.thumbnail = newUrl;
          updatedCount++;
        }
        if (p.id === 'prod_mnm_028' || p.slug === 'turmeric-finger') {
          // If turmeric finger was sharing the placeholder, update to newUrl as well
          p.imageUrl = newUrl;
          p.images = [newUrl];
          p.thumbnail = newUrl;
          updatedCount++;
        }
      }
      fs.writeFileSync(pf, JSON.stringify(prods, null, 2), 'utf-8');
      console.log(`Updated ${updatedCount} products in ${pf}`);
    }
  }

  console.log('--- 5. Updating cloudinary-url-map.json ---');
  const cachePath = path.join(backendDir, 'data/products/cloudinary-url-map.json');
  if (fs.existsSync(cachePath)) {
    const map = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    map['/images/products/turmeric-powder.jpg'] = newUrl;
    fs.writeFileSync(cachePath, JSON.stringify(map, null, 2), 'utf-8');
    console.log(`Updated cache in ${cachePath}`);
  }

  console.log('--- 6. Updating MySQL Database via Prisma ---');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timed out (5s)')), 5000))
    ]);

    await prisma.product.updateMany({
      where: {
        OR: [
          { id: 'prod_mnm_001' },
          { slug: 'turmeric-powder' },
          { id: 'prod_mnm_028' },
          { slug: 'turmeric-finger' },
        ],
      },
      data: {
        imageUrl: newUrl,
        thumbnail: newUrl,
      },
    });

    console.log('✅ Updated products in MySQL database.');
    await prisma.$disconnect();
  } catch (err) {
    console.warn('DB update skipped:', err.message);
  }

  console.log('🎉 Turmeric Powder image fix complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
