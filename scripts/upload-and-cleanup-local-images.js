const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const backendBase = path.resolve(__dirname, '..');
const cacheFile = path.join(backendBase, 'data/products/cloudinary-url-map.json');
const collDir = path.join(backendBase, 'public/images/collections');
const prodDir = path.join(backendBase, 'public/images/products');

const mobileCollDir = path.resolve(backendBase, '../manammcare_mobile_app/public/images/collections');
const mobileProdDir = path.resolve(backendBase, '../manammcare_mobile_app/public/images/products');

const websiteCollDir = path.resolve(backendBase, '../manammcare_website/public/images/collections');
const websiteProdDir = path.resolve(backendBase, '../manammcare_website/public/images/products');

let urlMap = {};
if (fs.existsSync(cacheFile)) {
  try {
    urlMap = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    console.log(`Loaded ${Object.keys(urlMap).length} cached Cloudinary mappings.`);
  } catch (e) {
    console.warn('Could not parse cache file, starting fresh.');
  }
}

async function uploadFile(filePath, folder, customPublicId) {
  try {
    const res = await cloudinary.uploader.upload(filePath, {
      folder: `manamm/${folder}`,
      public_id: customPublicId,
      overwrite: false,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
    });
    return res.secure_url;
  } catch (err) {
    // If it already exists on Cloudinary, retrieve its URL
    if (err.http_code === 400 && err.message && err.message.includes('already exists')) {
      console.log(`  Asset ${customPublicId} already exists in Cloudinary.`);
      return cloudinary.url(`manamm/${folder}/${customPublicId}`, { secure: true });
    }
    throw err;
  }
}

async function main() {
  console.log('=== Step 1: Upload Collections to Cloudinary ===');
  const collFiles = fs.existsSync(collDir) ? fs.readdirSync(collDir) : [];
  console.log(`Found ${collFiles.length} files in ${collDir}`);

  const successfulUploads = new Map(); // filename -> cloudinaryUrl

  for (let i = 0; i < collFiles.length; i++) {
    const file = collFiles[i];
    const fullPath = path.join(collDir, file);
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);

    const relativeCollPath = `/images/collections/${file}`;
    const relativeProdPath = `/images/products/${file}`;
    const fullUrl1 = `https://manammcare.com/images/collections/${file}`;
    const fullUrl2 = `https://manammcare.com/images/products/${file}`;

    let cloudUrl = urlMap[relativeCollPath] || urlMap[fullUrl1] || urlMap[relativeProdPath] || urlMap[fullUrl2];

    if (!cloudUrl || !cloudUrl.includes('cloudinary.com')) {
      console.log(`[${i + 1}/${collFiles.length}] Uploading collection: ${file}...`);
      try {
        cloudUrl = await uploadFile(fullPath, 'collections', baseName);
        console.log(`  -> Uploaded: ${cloudUrl}`);
      } catch (err) {
        console.error(`  -> ERROR uploading ${file}:`, err.message);
        continue;
      }
    } else {
      console.log(`[${i + 1}/${collFiles.length}] Already on Cloudinary: ${file} -> ${cloudUrl}`);
    }

    // Map all potential access paths to this Cloudinary URL
    urlMap[relativeCollPath] = cloudUrl;
    urlMap[relativeProdPath] = cloudUrl;
    urlMap[fullUrl1] = cloudUrl;
    urlMap[fullUrl2] = cloudUrl;
    successfulUploads.set(file, cloudUrl);

    // Save mapping incrementally
    fs.writeFileSync(cacheFile, JSON.stringify(urlMap, null, 2), 'utf8');
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log('\n=== Step 2: Upload Products to Cloudinary ===');
  const prodFiles = fs.existsSync(prodDir) ? fs.readdirSync(prodDir) : [];
  console.log(`Found ${prodFiles.length} files in ${prodDir}`);

  for (let i = 0; i < prodFiles.length; i++) {
    const file = prodFiles[i];
    const fullPath = path.join(prodDir, file);
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);

    const relativeProdPath = `/images/products/${file}`;
    const fullUrl1 = `https://manammcare.com/images/products/${file}`;
    const fullUrl2 = `https://manammcare.com/images/${file}`;

    // Check if we already have it from collections or previous mapping
    let cloudUrl = successfulUploads.get(file) || urlMap[relativeProdPath] || urlMap[fullUrl1] || urlMap[fullUrl2];

    // Search keys for exact filename match in urlMap
    if (!cloudUrl) {
      for (const [k, v] of Object.entries(urlMap)) {
        if ((k.endsWith('/' + file) || k.endsWith(file)) && v.includes('cloudinary.com')) {
          cloudUrl = v;
          break;
        }
      }
    }

    if (!cloudUrl || !cloudUrl.includes('cloudinary.com')) {
      console.log(`[${i + 1}/${prodFiles.length}] Uploading product: ${file}...`);
      try {
        cloudUrl = await uploadFile(fullPath, 'products', baseName);
        console.log(`  -> Uploaded: ${cloudUrl}`);
      } catch (err) {
        console.error(`  -> ERROR uploading ${file}:`, err.message);
        continue;
      }
    } else {
      console.log(`[${i + 1}/${prodFiles.length}] Mapped: ${file} -> ${cloudUrl}`);
    }

    urlMap[relativeProdPath] = cloudUrl;
    urlMap[fullUrl1] = cloudUrl;
    urlMap[fullUrl2] = cloudUrl;
    successfulUploads.set(file, cloudUrl);

    fs.writeFileSync(cacheFile, JSON.stringify(urlMap, null, 2), 'utf8');
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log('\n=== Step 3: Update JSON Data Files Across Projects ===');

  function replaceUrl(u) {
    if (typeof u !== 'string') return u;
    const clean = u.trim();
    if (urlMap[clean]) return urlMap[clean];

    // Check by basename
    const filename = clean.split('/').pop()?.split('?')[0];
    if (filename && successfulUploads.has(filename)) {
      return successfulUploads.get(filename);
    }
    return u;
  }

  // Update categories.json
  const catPath = path.join(backendBase, 'data/products/categories.json');
  if (fs.existsSync(catPath)) {
    const cats = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    let updatedCats = 0;
    for (const c of cats) {
      if (c.image) {
        const rep = replaceUrl(c.image);
        if (rep !== c.image) { c.image = rep; updatedCats++; }
      }
      if (c.imageUrl) {
        const rep = replaceUrl(c.imageUrl);
        if (rep !== c.imageUrl) { c.imageUrl = rep; updatedCats++; }
      }
    }
    fs.writeFileSync(catPath, JSON.stringify(cats, null, 2), 'utf8');
    console.log(`Updated ${updatedCats} category image URLs in backend.`);

    // Sync to mobile app & website
    const mobileCat = path.resolve(backendBase, '../manammcare_mobile_app/src/data/products/categories.json');
    if (fs.existsSync(path.dirname(mobileCat))) fs.writeFileSync(mobileCat, JSON.stringify(cats, null, 2), 'utf8');

    const webCat = path.resolve(backendBase, '../manammcare_website/src/data/categories.json');
    if (fs.existsSync(path.dirname(webCat))) fs.writeFileSync(webCat, JSON.stringify(cats, null, 2), 'utf8');
  }

  // Update products.json
  const prodPath = path.join(backendBase, 'data/products/products.json');
  if (fs.existsSync(prodPath)) {
    const prods = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
    let updatedProds = 0;
    for (const p of prods) {
      if (p.imageUrl) {
        const rep = replaceUrl(p.imageUrl);
        if (rep !== p.imageUrl) { p.imageUrl = rep; updatedProds++; }
      }
      if (p.thumbnail) {
        const rep = replaceUrl(p.thumbnail);
        if (rep !== p.thumbnail) { p.thumbnail = rep; }
      }
      if (Array.isArray(p.images)) {
        p.images = p.images.map((img) => replaceUrl(img));
      }
    }
    fs.writeFileSync(prodPath, JSON.stringify(prods, null, 2), 'utf8');
    console.log(`Updated ${updatedProds} product image URLs in backend.`);

    // Sync to mobile app & website
    const mobileProd = path.resolve(backendBase, '../manammcare_mobile_app/src/data/products/products.json');
    if (fs.existsSync(path.dirname(mobileProd))) fs.writeFileSync(mobileProd, JSON.stringify(prods, null, 2), 'utf8');

    const webProd = path.resolve(backendBase, '../manammcare_website/src/data/products.json');
    if (fs.existsSync(path.dirname(webProd))) fs.writeFileSync(webProd, JSON.stringify(prods, null, 2), 'utf8');
  }

  // Update product-images.json
  const piPath = path.join(backendBase, 'data/products/product-images.json');
  if (fs.existsSync(piPath)) {
    const pis = JSON.parse(fs.readFileSync(piPath, 'utf8'));
    for (const pi of pis) {
      if (pi.url) pi.url = replaceUrl(pi.url);
    }
    fs.writeFileSync(piPath, JSON.stringify(pis, null, 2), 'utf8');
  }

  console.log('\n=== Step 4: Verify All Uploads Before Deletion ===');
  let canDeleteCollections = true;
  for (const file of collFiles) {
    if (!successfulUploads.has(file)) {
      console.error(`CANNOT DELETE: Collection file ${file} failed to upload!`);
      canDeleteCollections = false;
    }
  }

  let canDeleteProducts = true;
  for (const file of prodFiles) {
    if (!successfulUploads.has(file)) {
      console.error(`CANNOT DELETE: Product file ${file} failed to upload!`);
      canDeleteProducts = false;
    }
  }

  if (canDeleteCollections && canDeleteProducts) {
    console.log('Verification PASSED: All files are securely stored on Cloudinary.');
    console.log('\n=== Step 5: Removing Local Image Files ===');

    let deletedCount = 0;

    function safeDelete(filePath) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    // Delete collections from backend, mobile app, and website
    for (const file of collFiles) {
      safeDelete(path.join(collDir, file));
      safeDelete(path.join(mobileCollDir, file));
      safeDelete(path.join(websiteCollDir, file));
    }

    // Delete products from backend, mobile app, and website
    for (const file of prodFiles) {
      safeDelete(path.join(prodDir, file));
      safeDelete(path.join(mobileProdDir, file));
      safeDelete(path.join(websiteProdDir, file));
    }

    // Create .gitkeep in each directory so empty dirs don't disappear if needed
    [collDir, prodDir, mobileCollDir, mobileProdDir, websiteCollDir, websiteProdDir].forEach((dir) => {
      if (fs.existsSync(dir)) {
        fs.writeFileSync(path.join(dir, '.gitkeep'), '', 'utf8');
      }
    });

    console.log(`Successfully deleted ${deletedCount} local image files across backend, mobile app, and website.`);
  } else {
    console.error('ABORTING LOCAL DELETION: Not all files were verified on Cloudinary.');
  }

  console.log('\n=== Process Complete! ===');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
