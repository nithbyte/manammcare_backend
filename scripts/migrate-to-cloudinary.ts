import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const backendDataDir = path.resolve('data/products');
const mobileDataDirs = [
  path.resolve('../manamm_app/src/data/products'),
  path.resolve('../manammcare_mobile_app/src/data/products'),
];
const websiteDataDirs = [
  path.resolve('../manammcare/src/data'),
  path.resolve('../manammcare_website/src/data'),
];
const websitePublicDirs = [
  path.resolve('../manammcare/public'),
  path.resolve('../manammcare_website/public'),
  path.resolve('uploads'),
];
const cacheFile = path.resolve('data/products/cloudinary-url-map.json');

function loadJson<T>(file: string): T {
  const p = path.join(backendDataDir, file);
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveJson(file: string, data: any) {
  const pBackend = path.join(backendDataDir, file);
  fs.writeFileSync(pBackend, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved updated backend JSON: ${pBackend}`);

  for (const dir of mobileDataDirs) {
    if (fs.existsSync(dir)) {
      const pMobile = path.join(dir, file);
      fs.writeFileSync(pMobile, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Synced to mobile app JSON: ${pMobile}`);
    }
  }

  for (const dir of websiteDataDirs) {
    if (fs.existsSync(dir)) {
      const pWeb = path.join(dir, file);
      if (fs.existsSync(pWeb)) {
        fs.writeFileSync(pWeb, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Synced to website JSON: ${pWeb}`);
      }
    }
  }
}

// Load existing cache
let urlMap: Record<string, string> = {};
if (fs.existsSync(cacheFile)) {
  try {
    urlMap = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    console.log(`Loaded ${Object.keys(urlMap).length} cached Cloudinary mappings.`);
  } catch {}
}

function getLocalFileForUrl(url: string): string | null {
  if (url.includes('manammcare.com/images/')) {
    const subPath = url.split('manammcare.com/images/')[1]?.split('?')[0];
    for (const base of websitePublicDirs) {
      const local = path.join(base, 'images', subPath);
      if (fs.existsSync(local)) return local;
    }
  }
  const filename = url.split('/').pop()?.split('?')[0];
  if (filename) {
    const localUpload = path.resolve('uploads/products', filename);
    if (fs.existsSync(localUpload)) return localUpload;

    for (const base of websitePublicDirs) {
      const localDirect = path.join(base, 'images/products', filename);
      if (fs.existsSync(localDirect)) return localDirect;
      const localBase = path.join(base, filename);
      if (fs.existsSync(localBase)) return localBase;
    }
  }
  return null;
}

function getPublicIdFromUrl(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const filename = path.basename(parsed.pathname).replace(/\.[^/.]+$/, '');
    if (filename && filename.length > 2 && !filename.includes('photo-')) {
      return `${filename}_${index}`;
    }
  } catch {}
  return `asset_${index}`;
}

async function uploadToCloudinary(url: string, index: number, folder: string): Promise<string> {
  if (urlMap[url] && urlMap[url].includes('cloudinary.com')) {
    return urlMap[url];
  }

  const localPath = getLocalFileForUrl(url);
  const source = localPath || url;
  const publicId = getPublicIdFromUrl(url, index);

  console.log(`[${index}] Uploading ${source}...`);

  try {
    const res = await cloudinary.uploader.upload(source, {
      folder: `manamm/${folder}`,
      public_id: publicId,
      overwrite: false,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    urlMap[url] = res.secure_url;
    fs.writeFileSync(cacheFile, JSON.stringify(urlMap, null, 2), 'utf-8');
    console.log(`  -> Uploaded: ${res.secure_url}`);
    return res.secure_url;
  } catch (err: any) {
    console.error(`  -> Failed to upload ${url}: ${err.message}`);
    // If remote fetch failed and local exists, try local
    if (localPath && source !== localPath) {
      try {
        const res = await cloudinary.uploader.upload(localPath, {
          folder: `manamm/${folder}`,
          public_id: publicId,
          overwrite: false,
          resource_type: 'auto',
          quality: 'auto:good',
          fetch_format: 'auto',
        });
        urlMap[url] = res.secure_url;
        fs.writeFileSync(cacheFile, JSON.stringify(urlMap, null, 2), 'utf-8');
        return res.secure_url;
      } catch (err2: any) {
        console.error(`  -> Local retry failed: ${err2.message}`);
      }
    }
    return url;
  }
}

async function main() {
  console.log('=== Starting Cloudinary Image Migration ===');

  const brands = loadJson<any[]>('brands.json');
  const categories = loadJson<any[]>('categories.json');
  const products = loadJson<any[]>('products.json');
  const productImages = loadJson<any[]>('product-images.json');

  // Collect unique URLs with category
  const uniqueUrls: { url: string; folder: string }[] = [];
  const seen = new Set<string>();

  function collect(url: any, folder: string) {
    if (typeof url === 'string' && url.trim().startsWith('http') && !url.includes('cloudinary.com')) {
      const clean = url.trim();
      if (!seen.has(clean)) {
        seen.add(clean);
        uniqueUrls.push({ url: clean, folder });
      }
    }
  }

  for (const b of brands) collect(b.logo, 'brands');
  for (const c of categories) {
    collect(c.image, 'categories');
    collect(c.imageUrl, 'categories');
  }
  for (const p of products) {
    collect(p.imageUrl, 'products');
    collect(p.thumbnail, 'products');
    if (Array.isArray(p.images)) {
      for (const img of p.images) collect(img, 'products');
    }
  }
  for (const pi of productImages) collect(pi.url, 'products');

  console.log(`Found ${uniqueUrls.length} unique images to migrate to Cloudinary.`);

  // Upload in small batches to respect rate limits
  let idx = 0;
  for (const item of uniqueUrls) {
    idx++;
    await uploadToCloudinary(item.url, idx, item.folder);
    // Tiny delay between uploads
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('=== All uploads complete. Now updating JSON files ===');

  function replaceUrl(u: any): string {
    if (typeof u === 'string' && urlMap[u.trim()]) {
      return urlMap[u.trim()];
    }
    return u;
  }

  // 1. Brands
  for (const b of brands) {
    if (b.logo) b.logo = replaceUrl(b.logo);
  }
  saveJson('brands.json', brands);

  // 2. Categories
  for (const c of categories) {
    if (c.image) c.image = replaceUrl(c.image);
    if (c.imageUrl) c.imageUrl = replaceUrl(c.imageUrl);
  }
  saveJson('categories.json', categories);

  // 3. Products
  for (const p of products) {
    if (p.imageUrl) p.imageUrl = replaceUrl(p.imageUrl);
    if (p.thumbnail) p.thumbnail = replaceUrl(p.thumbnail);
    if (Array.isArray(p.images)) {
      p.images = p.images.map((img: string) => replaceUrl(img));
    }
  }
  saveJson('products.json', products);

  // 4. Product Images
  for (const pi of productImages) {
    if (pi.url) pi.url = replaceUrl(pi.url);
  }
  saveJson('product-images.json', productImages);

  console.log('=== Migration to Cloudinary Finished Successfully! ===');
}

main().catch(console.error);
