const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.manammcare.com/api';

async function loginAdmin() {
  console.log('Logging in to live API as admin...');
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'admin@manammcare.com',
      password: 'Admin@1234',
    }),
  });

  const data = await res.json();
  const token = data?.data?.token || data?.token;
  if (!token) {
    throw new Error(`Failed to log in: ${JSON.stringify(data)}`);
  }
  console.log('Admin login successful!');
  return token;
}

async function syncAllProducts() {
  const token = await loginAdmin();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const productsPath = path.resolve(__dirname, '../data/products/products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  console.log(`Loaded ${products.length} products from local catalog.`);

  // 1. Sync all MANAMM manufactured products (prod_mnm_001 to prod_mnm_040)
  const mnmProducts = products.filter((p) => p.id && p.id.startsWith('prod_mnm_'));
  console.log(`\n=== STEP 1: Updating ${mnmProducts.length} MANAMM Manufactured Products in Live DB ===`);

  let mnmUpdated = 0;
  for (const p of mnmProducts) {
    try {
      const patchRes = await fetch(`${API_BASE}/admin/products/${p.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          imageUrl: p.imageUrl,
          thumbnail: p.imageUrl,
          images: Array.isArray(p.images) && p.images.length ? p.images : [p.imageUrl],
          name: p.name,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
        }),
      });

      if (patchRes.ok) {
        mnmUpdated++;
        console.log(`  ✓ Updated ${p.id} (${p.slug}) -> ${p.imageUrl.split('/').pop()}`);
      } else {
        const errText = await patchRes.text();
        console.error(`  ✗ Failed ${p.id}: ${patchRes.status} ${errText}`);
      }
    } catch (err) {
      console.error(`  ✗ Error updating ${p.id}: ${err.message}`);
    }
  }
  console.log(`MANAMM products update complete: ${mnmUpdated}/${mnmProducts.length} updated successfully.\n`);

  // 2. Sync newly added dresses (prod_drs_29 to prod_drs_52) and accessories (prod_acc_01 to prod_acc_61)
  const newItems = products.filter(
    (p) =>
      p.id &&
      (p.id.startsWith('prod_acc_') ||
        (p.id.startsWith('prod_drs_') && parseInt(p.id.replace('prod_drs_', ''), 10) >= 29))
  );

  console.log(`=== STEP 2: Creating/Syncing ${newItems.length} Partner Dresses & Accessories in Live DB ===`);
  let createdCount = 0;
  let alreadyExistCount = 0;

  for (const item of newItems) {
    // Check if it already exists
    const checkRes = await fetch(`${API_BASE}/products/${item.slug}`);
    if (checkRes.ok) {
      alreadyExistCount++;
      // Just patch image if needed
      await fetch(`${API_BASE}/admin/products/${item.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          imageUrl: item.imageUrl,
          thumbnail: item.imageUrl,
          images: Array.isArray(item.images) ? item.images : [item.imageUrl],
        }),
      });
      continue;
    }

    // Determine category
    const catId = item.categoryId || (item.id.startsWith('prod_acc_') ? 'cat_accessories' : 'cat_dresses');

    // Create product
    try {
      const createRes = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: item.name,
          sku: item.sku,
          slug: item.slug,
          description: item.description || item.shortDescription || item.name,
          shortDescription: item.shortDescription || item.description || item.name,
          categoryId: catId,
          brandId: item.brandId || 'brd_partner_collections',
          price: Number(item.price),
          compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
          discountPercentage: item.discountPercentage || 0,
          stock: item.stock || 50,
          unit: item.unit || '1 Unit',
          imageUrl: item.imageUrl,
          images: Array.isArray(item.images) ? item.images : [item.imageUrl],
          thumbnail: item.thumbnail || item.imageUrl,
          attributes: item.attributes || [],
          tags: item.tags || [],
          isAvailable: true,
          isActive: true,
          isFeatured: Boolean(item.isFeatured || item.featured),
        }),
      });

      if (createRes.ok) {
        createdCount++;
        console.log(`  ✓ Created ${item.id} (${item.slug})`);
      } else {
        const errText = await createRes.text();
        console.error(`  ✗ Create failed for ${item.id}: ${createRes.status} ${errText}`);
      }
    } catch (err) {
      console.error(`  ✗ Network error creating ${item.id}: ${err.message}`);
    }
  }

  console.log(`\nNew items sync complete: ${createdCount} created, ${alreadyExistCount} updated.`);
}

syncAllProducts().catch(console.error);
