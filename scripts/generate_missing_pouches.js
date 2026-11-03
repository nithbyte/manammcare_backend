const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hawhugfs',
  api_key: process.env.CLOUDINARY_API_KEY || '478235249832675',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IiTXNYv67dXWMAeWe7YaDZ20wjM',
  secure: true,
});

const masterPouch = 'C:/Users/Nithesh/.gemini/antigravity/brain/c67ebf40-1ee9-472e-9a6a-60dfc4148dd1/.user_uploaded/media_1793712573661_36c274fe.jpg';
const outputDir = path.join(__dirname, 'generated_pouches');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const webPublicDir = path.resolve(__dirname, '../../manammcare/public/images/products');
const appAssetsDir = path.resolve(__dirname, '../../manamm_app/assets/products');
const brainDir = 'C:/Users/Nithesh/.gemini/antigravity/brain/c67ebf40-1ee9-472e-9a6a-60dfc4148dd1';

const MISSING_PRODUCTS = [
  {
    id: 'prod_mnm_010',
    slug: 'turmeric-finger',
    english: 'TURMERIC FINGER',
    tamil: 'விரலி மஞ்சள்',
    netWt: '200 g',
    hue: 140,
    textColor: '#78350f',
    subColor: '#92400e'
  },
  {
    id: 'prod_mnm_027',
    slug: 'chia-seeds',
    english: 'CHIA SEEDS',
    tamil: 'சியா விதை',
    netWt: '100 g',
    hue: 320,
    textColor: '#1e1b4b',
    subColor: '#312e81'
  },
  {
    id: 'prod_mnm_028',
    slug: 'flax-seeds',
    english: 'FLAX SEEDS',
    tamil: 'ஆளி விதை',
    netWt: '100 g',
    hue: 140,
    textColor: '#78350f',
    subColor: '#92400e'
  },
  {
    id: 'prod_mnm_032',
    slug: 'jaggery',
    english: 'PURE JAGGERY',
    tamil: 'நாட்டு சர்க்கரை',
    netWt: '500 g',
    hue: 140,
    textColor: '#78350f',
    subColor: '#92400e'
  },
  {
    id: 'prod_mnm_033',
    slug: 'semiya',
    english: 'ROASTED SEMIYA',
    tamil: 'வறுத்த சேமியா',
    netWt: '200 g',
    hue: 140,
    textColor: '#78350f',
    subColor: '#92400e'
  },
  {
    id: 'prod_mnm_034',
    slug: 'sooji',
    english: 'ROASTED SOOJI',
    tamil: 'ரவை',
    netWt: '500 g',
    hue: 140,
    textColor: '#78350f',
    subColor: '#92400e'
  },
  {
    id: 'prod_mnm_035',
    slug: 'rice-flour',
    english: 'RICE FLOUR',
    tamil: 'அரிசி மாவு',
    netWt: '500 g',
    hue: 280,
    textColor: '#0e7490',
    subColor: '#155e75'
  },
  {
    id: 'prod_mnm_036',
    slug: 'maida-flour',
    english: 'MAIDA FLOUR',
    tamil: 'மைதா மாவு',
    netWt: '500 g',
    hue: 320,
    textColor: '#1e1b4b',
    subColor: '#312e81'
  },
  {
    id: 'prod_mnm_037',
    slug: 'tamarind',
    english: 'NATURAL TAMARIND',
    tamil: 'புளி',
    netWt: '500 g',
    hue: 45,
    textColor: '#450a0a',
    subColor: '#7f1d1d'
  },
  {
    id: 'prod_mnm_038',
    slug: 'thattai',
    english: 'CRISPY THATTAI',
    tamil: 'தட்டை',
    netWt: '200 g',
    hue: 90,
    textColor: '#991b1b',
    subColor: '#b91c1c'
  },
  {
    id: 'prod_mnm_039',
    slug: 'palm-sugar',
    english: 'PALM SUGAR',
    tamil: 'பனை சர்க்கரை',
    netWt: '200 g',
    hue: 140,
    textColor: '#78350f',
    subColor: '#92400e'
  },
  {
    id: 'prod_mnm_040',
    slug: 'wheat-flour',
    english: 'WHEAT FLOUR (ATTA)',
    tamil: 'கோதுமை மாவு',
    netWt: '1 kg',
    hue: 190,
    textColor: '#065f46',
    subColor: '#047857'
  }
];

async function generateAll() {
  const urlMap = {};

  for (const item of MISSING_PRODUCTS) {
    console.log(`Generating packaging for ${item.english} (${item.slug})...`);
    
    // 1. Shift hue to target color gradient on master pouch (686x1024)
    const baseBuf = await sharp(masterPouch)
      .modulate({ hue: item.hue, saturation: 1.12 })
      .toBuffer();

    // 2. Create SVG badge overlay (345x92)
    const badgeWidth = 345;
    const badgeHeight = 92;
    const badgeSvg = Buffer.from(`
      <svg width="${badgeWidth}" height="${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
            <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.95"/>
          </linearGradient>
          <filter id="badgeShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.15"/>
          </filter>
        </defs>
        <!-- Background badge covering previous label -->
        <rect x="0" y="0" width="${badgeWidth}" height="${badgeHeight}" rx="10" fill="url(#badgeGrad)" stroke="#e2e8f0" stroke-width="1" filter="url(#badgeShadow)"/>
        
        <!-- English Name -->
        <text x="16" y="29" font-family="Arial, 'Helvetica Neue', sans-serif" font-size="22" font-weight="900" fill="${item.textColor}" letter-spacing="0.3">${item.english}</text>
        
        <!-- Tamil Name -->
        <text x="16" y="58" font-family="'Noto Sans Tamil', Arial, sans-serif" font-size="20" font-weight="bold" fill="${item.subColor}">${item.tamil}</text>
        
        <!-- Net Weight -->
        <text x="16" y="80" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#475569" letter-spacing="0.5">NET WT: ${item.netWt}</text>
      </svg>
    `);

    // 3. Composite badge at top: 748, left: 108 and resize to standard 800x1000 packshot
    const localFile = path.join(outputDir, `${item.slug}.jpg`);
    await sharp(baseBuf)
      .composite([{ input: badgeSvg, top: 748, left: 108 }])
      .resize(800, 1000, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 }
      })
      .jpeg({ quality: 95 })
      .toFile(localFile);

    // 4. Copy to web, mobile app, and brain directories
    const webTarget = path.join(webPublicDir, `${item.slug}.jpg`);
    const appTarget = path.join(appAssetsDir, `${item.slug}.jpg`);
    const brainTarget = path.join(brainDir, `manamm_${item.slug}_pouch.jpg`);
    fs.copyFileSync(localFile, webTarget);
    fs.copyFileSync(localFile, appTarget);
    fs.copyFileSync(localFile, brainTarget);

    // 5. Upload to Cloudinary
    console.log(`Uploading ${item.slug} to Cloudinary...`);
    const upRes = await cloudinary.uploader.upload(localFile, {
      folder: 'manamm/products',
      public_id: item.slug,
      overwrite: true,
      invalidate: true
    });
    console.log(`Uploaded ${item.slug} -> ${upRes.secure_url}`);
    urlMap[item.id] = upRes.secure_url;
  }

  // 6. Update all 3 catalog databases
  console.log('\n--- Syncing all product datasets ---');
  const catalogPaths = [
    path.resolve(__dirname, '../../manammcare/src/data/products.json'),
    path.resolve(__dirname, '../../manamm_app/src/data/products/products.json'),
    path.resolve(__dirname, '../data/products/products.json')
  ];

  catalogPaths.forEach(cp => {
    if (!fs.existsSync(cp)) return;
    const list = JSON.parse(fs.readFileSync(cp, 'utf8'));
    let updatedCount = 0;
    list.forEach(p => {
      if (urlMap[p.id]) {
        p.imageUrl = urlMap[p.id];
        p.images = [urlMap[p.id]];
        p.thumbnail = urlMap[p.id];
        updatedCount++;
      }
    });
    fs.writeFileSync(cp, JSON.stringify(list, null, 2) + '\n');
    console.log(`Updated ${updatedCount} products in ${cp}`);
  });

  fs.writeFileSync(path.join(__dirname, 'group_b_uploaded.json'), JSON.stringify(urlMap, null, 2));
  console.log('=== ALL 12 PACKAGES GENERATED, UPLOADED, AND CATALOGED ===');
}

generateAll().catch(e => {
  console.error('Generation failed:', e);
  process.exit(1);
});
