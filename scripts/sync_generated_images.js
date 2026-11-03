const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: 'hawhugfs',
  api_key: '478235249832675',
  api_secret: 'IiTXNYv67dXWMAeWe7YaDZ20wjM',
  secure: true,
});

const PRODUCT_SLUG_MAP = {
  turmeric_powder: { id: 'prod_mnm_001', slug: 'turmeric-powder', name: 'Turmeric Powder' },
  black_pepper: { id: 'prod_mnm_002', slug: 'pepper', name: 'Pepper' },
  cumin_seeds: { id: 'prod_mnm_003', slug: 'cumins', name: 'Cumins' },
  mustard: { id: 'prod_mnm_004', slug: 'mustard', name: 'Mustard' },
  fenugreek: { id: 'prod_mnm_005', slug: 'fenugreek', name: 'Fenugreek' },
  fennel: { id: 'prod_mnm_006', slug: 'fennel', name: 'Fennel' },
  round_chillies: { id: 'prod_mnm_007', slug: 'round-chillies', name: 'Round Chillies' },
  long_chilli: { id: 'prod_mnm_008', slug: 'long-chilli', name: 'Long Chilli' },
  coriander: { id: 'prod_mnm_009', slug: 'coriander', name: 'Coriander' },
  turmeric_finger: { id: 'prod_mnm_010', slug: 'turmeric-finger', name: 'Turmeric Finger' },
  black_channa: { id: 'prod_mnm_011', slug: 'black-channa', name: 'Black Channa' },
  white_channa: { id: 'prod_mnm_012', slug: 'white-channa', name: 'White Channa' },
  red_gram: { id: 'prod_mnm_013', slug: 'red-gram', name: 'Red Gram' },
  peas: { id: 'prod_mnm_014', slug: 'peas', name: 'Peas' },
  white_beans: { id: 'prod_mnm_015', slug: 'white-beans', name: 'White Beans' },
  thur_dhal: { id: 'prod_mnm_016', slug: 'thur-dhal', name: 'Thur Dhal' },
  gram_dhal: { id: 'prod_mnm_017', slug: 'gram-dhal', name: 'Gram Dhal' },
  moong_dhal: { id: 'prod_mnm_018', slug: 'moong-dhal', name: 'Moong Dhal' },
  orid_dhal: { id: 'prod_mnm_019', slug: 'orid-dhal', name: 'Orid Dhal' },
  whole_green_gram: { id: 'prod_mnm_020', slug: 'whole-green-gram', name: 'Whole Green Gram' },
  black_gram_dhal: { id: 'prod_mnm_021', slug: 'black-gram-dhal', name: 'Black Gram Dhal' },
  soyabeans: { id: 'prod_mnm_022', slug: 'soyabeans', name: 'Soyabeans' },
  double_beans: { id: 'prod_mnm_023', slug: 'double-beans', name: 'Double Beans' },
  white_gingelly_seeds: { id: 'prod_mnm_024', slug: 'white-gingelly-seeds', name: 'White Gingelly Seeds' },
  black_gingelly_seeds: { id: 'prod_mnm_025', slug: 'black-gingelly-seeds', name: 'Black Gingelly Seeds' },
  pumpkin_seeds: { id: 'prod_mnm_026', slug: 'pumpkin-seeds', name: 'Pumpkin Seeds' },
  chia_seeds: { id: 'prod_mnm_027', slug: 'chia-seeds', name: 'Chia Seeds' },
  flax_seeds: { id: 'prod_mnm_028', slug: 'flax-seeds', name: 'Flax Seeds' },
  fried_grams: { id: 'prod_mnm_029', slug: 'fried-grams', name: 'Fried Grams' },
  fried_groundnuts: { id: 'prod_mnm_030', slug: 'fried-groundnuts', name: 'Fried Groundnuts' },
  sugar: { id: 'prod_mnm_031', slug: 'sugar', name: 'Sugar' },
  jaggery: { id: 'prod_mnm_032', slug: 'jaggery', name: 'Jaggery' },
  semiya: { id: 'prod_mnm_033', slug: 'semiya', name: 'Semiya' },
  sooji: { id: 'prod_mnm_034', slug: 'sooji', name: 'Sooji' },
  rice_flour: { id: 'prod_mnm_035', slug: 'rice-flour', name: 'Rice Flour' },
  maida_flour: { id: 'prod_mnm_036', slug: 'maida-flour', name: 'Maida Flour' },
  tamarind: { id: 'prod_mnm_037', slug: 'tamarind', name: 'Tamarind' },
  thattai: { id: 'prod_mnm_038', slug: 'thattai', name: 'Thattai' },
  palm_sugar: { id: 'prod_mnm_039', slug: 'palm-sugar', name: 'Palm Sugar' },
  wheat_flour: { id: 'prod_mnm_040', slug: 'wheat-flour', name: 'Wheat Flour' },
};

function getGeneratedImages(searchDir) {
  const files = fs.readdirSync(searchDir);
  const map = {};
  for (const f of files) {
    if (f.startsWith('manamm_') && f.endsWith('.jpg')) {
      for (const key of Object.keys(PRODUCT_SLUG_MAP)) {
        if (f.includes(`manamm_${key}_pouch`)) {
          // Keep newest file if multiple
          const fullPath = path.join(searchDir, f);
          const stat = fs.statSync(fullPath);
          if (!map[key] || map[key].mtime < stat.mtimeMs) {
            map[key] = { path: fullPath, mtime: stat.mtimeMs };
          }
        }
      }
    }
  }
  return map;
}

async function uploadAndSync() {
  const brainDir = 'C:\\Users\\Nithesh\\.gemini\\antigravity\\brain\\c67ebf40-1ee9-472e-9a6a-60dfc4148dd1';
  const imgMap = getGeneratedImages(brainDir);

  console.log(`Found ${Object.keys(imgMap).length} of 40 generated images.`);

  const publicImgDir = path.resolve('../manammcare/public/images/products');
  if (!fs.existsSync(publicImgDir)) fs.mkdirSync(publicImgDir, { recursive: true });

  const urlResults = {};

  for (const [key, meta] of Object.entries(imgMap)) {
    const item = PRODUCT_SLUG_MAP[key];
    const targetLocal = path.join(publicImgDir, `${item.slug}.jpg`);
    fs.copyFileSync(meta.path, targetLocal);

    console.log(`Uploading ${item.slug} (${meta.path}) to Cloudinary...`);
    try {
      const uploadRes = await cloudinary.uploader.upload(meta.path, {
        folder: 'manamm/products',
        public_id: item.slug,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
      });
      console.log(`Uploaded ${item.slug} -> ${uploadRes.secure_url}`);
      urlResults[item.id] = uploadRes.secure_url;
    } catch (err) {
      console.error(`Upload failed for ${item.slug}:`, err.message);
      urlResults[item.id] = `https://manammcare.com/images/products/${item.slug}.jpg`;
    }
  }

  // Update datasets
  const datasetPaths = [
    path.resolve('../manammcare/src/data/products.json'),
    path.resolve('../manamm_app/src/data/products/products.json'),
    path.resolve('data/products/products.json'),
  ];

  for (const pPath of datasetPaths) {
    if (fs.existsSync(pPath)) {
      const data = JSON.parse(fs.readFileSync(pPath, 'utf8'));
      let modified = 0;
      for (const prod of data) {
        if (urlResults[prod.id]) {
          prod.imageUrl = urlResults[prod.id];
          if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
            prod.images[0] = urlResults[prod.id];
          } else {
            prod.images = [urlResults[prod.id]];
          }
          if (prod.thumbnail !== undefined) {
            prod.thumbnail = urlResults[prod.id];
          }
          modified++;
        }
      }
      fs.writeFileSync(pPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${modified} products in ${pPath}`);
    }
  }

  // Also check database sync if prisma exists
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    let dbUpdated = 0;
    for (const [prodId, url] of Object.entries(urlResults)) {
      try {
        await prisma.product.updateMany({
          where: {
            OR: [
              { id: prodId },
              { sku: `SKU-${prodId.toUpperCase()}` },
            ],
          },
          data: {
            imageUrl: url,
            thumbnail: url,
          },
        });
        dbUpdated++;
      } catch (e) {
        // ignore
      }
    }
    console.log(`Updated ${dbUpdated} products in MySQL database.`);
    await prisma.$disconnect();
  } catch (e) {
    console.log('Database update skipped or completed without direct connection:', e.message);
  }

  console.log('Sync finished successfully!');
}

uploadAndSync().catch(console.error);
