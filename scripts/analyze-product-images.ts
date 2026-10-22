import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.resolve('data/products');

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
}

const brands = readJson('brands.json');
const categories = readJson('categories.json');
const products = readJson('products.json');
const productImages = readJson('product-images.json');

const urlMap = new Map<string, { sources: string[] }>();

function addUrl(url: any, source: string) {
  if (typeof url === 'string' && url.trim().startsWith('http')) {
    const clean = url.trim();
    if (!urlMap.has(clean)) {
      urlMap.set(clean, { sources: [] });
    }
    urlMap.get(clean)!.sources.push(source);
  }
}

for (const b of brands) {
  addUrl(b.logo, `brand:${b.id}`);
}

for (const c of categories) {
  addUrl(c.image, `cat:${c.id}`);
  addUrl(c.imageUrl, `cat:${c.id}`);
}

for (const p of products) {
  addUrl(p.imageUrl, `prod:${p.id}`);
  addUrl(p.thumbnail, `prod:${p.id}`);
  if (Array.isArray(p.images)) {
    for (const img of p.images) {
      addUrl(img, `prod:${p.id}`);
    }
  }
}

for (const pi of productImages) {
  addUrl(pi.url, `prodImage:${pi.id}`);
}

console.log(`Total unique image URLs across data/products: ${urlMap.size}`);

const domains: Record<string, number> = {};
for (const [url] of urlMap) {
  try {
    const domain = new URL(url).hostname;
    domains[domain] = (domains[domain] || 0) + 1;
  } catch {
    domains['invalid'] = (domains['invalid'] || 0) + 1;
  }
}
console.log('Domains breakdown:', domains);
