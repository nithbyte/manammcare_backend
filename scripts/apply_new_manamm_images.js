const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hawhugfs',
  api_key: process.env.CLOUDINARY_API_KEY || '478235249832675',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IiTXNYv67dXWMAeWe7YaDZ20wjM',
});

const SOURCE_DIR = 'C:\\Users\\Nithesh\\Downloads\\img';
const WEB_IMG_DIR = path.resolve(__dirname, '../../manammcare/public/images/products');
const APP_IMG_DIR = path.resolve(__dirname, '../../manamm_app/assets/products');

const WEB_JSON = path.resolve(__dirname, '../../manammcare/src/data/products.json');
const APP_JSON = path.resolve(__dirname, '../../manamm_app/src/data/products/products.json');
const BACKEND_JSON = path.resolve(__dirname, '../data/products/products.json');

const mappings = [
  { file: '011a60d3-5db6-4dc9-a544-51c79ac6548f.png', id: 'prod_mnm_030', slug: 'fried-groundnuts', name: 'Fried Groundnuts' },
  { file: '111f64fe-f5b9-4078-a581-c065d425a047.png', id: 'prod_mnm_012', slug: 'white-channa', name: 'White Channa' },
  { file: '14313e63-8a99-4aa2-9e91-93b73dc9e80d.png', id: 'prod_mnm_038', slug: 'thattai', name: 'Thattai' },
  { file: '1558830b-602d-4ece-810c-8a043e17969b.png', id: 'prod_mnm_034', slug: 'sooji', name: 'Sooji' },
  { file: '1619699b-478a-4dd0-9b9b-ab8a302e5ff6.png', id: 'prod_mnm_032', slug: 'jaggery', name: 'Jaggery' },
  { file: '18c68ae8-52ea-4d86-a2f3-c7f350d9ad0f.png', id: 'prod_mnm_005', slug: 'fenugreek', name: 'Fenugreek' },
  { file: '19e03a74-af6a-46d5-80cd-bf80f15ac06f.png', id: 'prod_mnm_024', slug: 'white-gingelly-seeds', name: 'White Gingelly Seeds' },
  { file: '1cdcdd1c-e4ee-4ab0-83cf-0d283b6a4e0b.png', id: 'prod_mnm_018', slug: 'moong-dhal', name: 'Moong Dhal' },
  { file: '36839c15-2015-4644-9231-765842902afb.png', id: 'prod_mnm_014', slug: 'peas', name: 'Peas' },
  { file: '3810bfdc-7420-4851-95eb-826fcc1d0f5d.png', id: 'prod_mnm_016', slug: 'thur-dhal', name: 'Thur Dhal' },
  { file: '39aee41a-268b-4aa5-b65c-279c2f81ef00.png', id: 'prod_mnm_031', slug: 'sugar', name: 'Sugar' },
  { file: '3d311f19-5b3f-4164-9798-fc2ca8366b8b.png', id: 'prod_mnm_036', slug: 'maida-flour', name: 'Maida Flour' },
  { file: '422e6f35-5e99-4e84-b6d6-a2e57ce3a364.png', id: 'prod_mnm_007', slug: 'round-chillies', name: 'Round Chillies' },
  { file: '4ac7f1fc-ffea-4b0f-b5c9-91850821ba1a.png', id: 'prod_mnm_037', slug: 'tamarind', name: 'Tamarind' },
  { file: '4f858755-bd93-4341-a284-4a804591983b.png', id: 'prod_mnm_026', slug: 'pumpkin-seeds', name: 'Pumpkin Seeds' },
  { file: '4fa2f7ba-0a26-49d7-867e-6bce75920155.png', id: 'prod_mnm_033', slug: 'semiya', name: 'Semiya' },
  { file: '648b167f-f55d-41d2-88e2-f5e8d06fa923.png', id: 'prod_mnm_040', slug: 'wheat-flour', name: 'Wheat Flour' },
  { file: '6f344999-1c35-4edc-b466-560e1dc57b09.png', id: 'prod_mnm_004', slug: 'mustard', name: 'Mustard' },
  { file: '852c9499-1cb4-4850-bc16-54368b3f8e02.png', id: 'prod_mnm_039', slug: 'palm-sugar', name: 'Palm Sugar' },
  { file: '8903dc60-a1aa-4201-85f8-d4e7b416037f.png', id: 'prod_mnm_029', slug: 'fried-grams', name: 'Fried Grams' },
  { file: '8b4aae53-76c7-41c1-95a1-92f38bfec7c8.png', id: 'prod_mnm_028', slug: 'flax-seeds', name: 'Flax Seeds' },
  { file: 'a1cc5211-3505-482b-91d3-235b73569e6f.png', id: 'prod_mnm_027', slug: 'chia-seeds', name: 'Chia Seeds' },
  { file: 'a5fb0ebc-e15b-4c60-a718-954fd7e230f6.png', id: 'prod_mnm_017', slug: 'gram-dhal', name: 'Gram Dhal' },
  { file: 'aaeaacd4-c90f-4824-9311-22515f8040ca.png', id: 'prod_mnm_022', slug: 'soyabeans', name: 'Soyabeans' },
  { file: 'bdfbd2c0-e6d3-4046-87ef-b3c8479a07e9.png', id: 'prod_mnm_002', slug: 'pepper', name: 'Pepper' },
  { file: 'e154fbc2-0f3b-451b-a7be-fcdbe5924e06.png', id: 'prod_mnm_035', slug: 'rice-flour', name: 'Rice Flour' },
  { file: 'eab12ddd-f073-4f94-b0d5-bb4b7fe9c034.png', id: 'prod_mnm_003', slug: 'cumins', name: 'Cumins' },
  { file: 'eb7dafd4-3366-42e5-b3f3-849235d5052a.png', id: 'prod_mnm_010', slug: 'turmeric-finger', name: 'Turmeric Finger' }
];

async function main() {
  console.log(`Starting update for ${mappings.length} MANAMM manufactured products...`);

  // Load existing catalogs
  const webProducts = JSON.parse(fs.readFileSync(WEB_JSON, 'utf8'));
  const appProducts = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const backendProducts = JSON.parse(fs.readFileSync(BACKEND_JSON, 'utf8'));

  const urlMap = {};

  for (let i = 0; i < mappings.length; i++) {
    const item = mappings[i];
    const srcPng = path.join(SOURCE_DIR, item.file);
    const destJpgName = `${item.slug}.jpg`;
    const webJpg = path.join(WEB_IMG_DIR, destJpgName);
    const appJpg = path.join(APP_IMG_DIR, destJpgName);

    console.log(`\n[${i + 1}/${mappings.length}] Processing ${item.name} (${item.slug})...`);

    // Convert PNG to high-quality JPEG
    await sharp(srcPng)
      .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
      .toFile(webJpg);

    fs.copyFileSync(webJpg, appJpg);
    console.log(`  Saved locally to web and app: ${destJpgName}`);

    // Upload to Cloudinary
    console.log(`  Uploading to Cloudinary manamm/products/${item.slug}...`);
    const uploadRes = await cloudinary.uploader.upload(webJpg, {
      folder: 'manamm/products',
      public_id: item.slug,
      overwrite: true,
      invalidate: true
    });

    const newUrl = uploadRes.secure_url;
    urlMap[item.id] = newUrl;
    console.log(`  Cloudinary URL: ${newUrl}`);

    // Update in catalogs
    const updateProductInList = (list) => {
      const p = list.find(x => x.id === item.id || x.slug === item.slug);
      if (p) {
        p.imageUrl = newUrl;
        p.images = [newUrl];
        p.thumbnail = newUrl;
      }
    };

    updateProductInList(webProducts);
    updateProductInList(appProducts);
    updateProductInList(backendProducts);
  }

  // Save all catalogs
  fs.writeFileSync(WEB_JSON, JSON.stringify(webProducts, null, 2));
  fs.writeFileSync(APP_JSON, JSON.stringify(appProducts, null, 2));
  fs.writeFileSync(BACKEND_JSON, JSON.stringify(backendProducts, null, 2));

  console.log('\nAll 28 MANAMM manufactured products successfully updated across all 3 catalogs!');

  // Save manifest
  const manifestFile = path.join(__dirname, 'updated_mnm_packaging_manifest.json');
  fs.writeFileSync(manifestFile, JSON.stringify(urlMap, null, 2));
  console.log('Saved manifest to', manifestFile);
}

main().catch(console.error);

