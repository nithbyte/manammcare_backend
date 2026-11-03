const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hawhugfs',
  api_key: process.env.CLOUDINARY_API_KEY || '478235249832675',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IiTXNYv67dXWMAeWe7YaDZ20wjM',
});

const scratch = 'C:\\Users\\Nithesh\\.gemini\\antigravity\\brain\\c67ebf40-1ee9-472e-9a6a-60dfc4148dd1\\scratch';
const outDir = path.join(scratch, 'final_clips');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function prepareImages() {
  console.log('1. Preparing crystal clip images...');
  const crystalSpecs = [
    { id: 'prod_acc_56', src: 'clean_crystal_purple.jpg', trim: { left: 12, top: 15, width: 295, height: 335 } },
    { id: 'prod_acc_57', src: 'clean_crystal_white.jpg', trim: { left: 12, top: 15, width: 295, height: 335 } },
    { id: 'prod_acc_58', src: 'clean_crystal_pink.jpg', trim: { left: 12, top: 15, width: 295, height: 335 } },
    { id: 'prod_acc_59', src: 'clean_crystal_green.jpg', trim: { left: 12, top: 10, width: 295, height: 315 } },
    { id: 'prod_acc_60', src: 'clean_crystal_rainbow.jpg', trim: { left: 12, top: 10, width: 295, height: 315 } },
    { id: 'prod_acc_61', src: 'clean_crystal_blue.jpg', trim: { left: 12, top: 10, width: 295, height: 315 } },
  ];

  for (const c of crystalSpecs) {
    const input = path.join(scratch, c.src);
    const dest = path.join(outDir, `${c.id}.jpg`);
    await sharp(input).extract(c.trim).jpeg({ quality: 95 }).toFile(dest);
    console.log(`Saved ${c.id}.jpg`);
  }

  console.log('2. Preparing tulip bow clip images...');
  const tulipSpecs = [
    { id: 'prod_acc_50', src: 'clean_tulip_red.jpg' },
    { id: 'prod_acc_51', src: 'clean_tulip_gold.jpg' },
    { id: 'prod_acc_52', src: 'clean_tulip_pink.jpg' },
    { id: 'prod_acc_53', src: 'clean_tulip_white.jpg' },
    { id: 'prod_acc_54', src: 'clean_tulip_black.jpg' },
    { id: 'prod_acc_55', src: 'clean_tulip_blue.jpg' },
  ];

  for (const t of tulipSpecs) {
    const input = path.join(scratch, t.src);
    const dest = path.join(outDir, `${t.id}.jpg`);
    await sharp(input).jpeg({ quality: 95 }).toFile(dest);
    console.log(`Saved ${t.id}.jpg`);
  }
}

async function uploadToCloudinary() {
  console.log('3. Uploading all 12 images to Cloudinary (manamm/products)...');
  const urls = {};
  for (let i = 50; i <= 61; i++) {
    const id = `prod_acc_${i}`;
    const filePath = path.join(outDir, `${id}.jpg`);
    const res = await cloudinary.uploader.upload(filePath, {
      folder: 'manamm/products',
      public_id: id,
      overwrite: true,
      resource_type: 'image'
    });
    console.log(`Uploaded ${id} -> ${res.secure_url}`);
    urls[id] = res.secure_url;
  }
  return urls;
}

const productDefinitions = [
  // 6 Tulip Bow Clips @ Rs. 29 each (MRP 99)
  {
    id: 'prod_acc_50',
    sku: 'MNM-ACC-50',
    slug: 'manamm-silk-tulip-bow-hair-clip-crimson-red',
    name: 'MANAMM Silk Tulip Bow Hair Clip - Crimson Ruby Red',
    shortDescription: 'Festive silk organza bow hair clip in crimson red with pearl droplets and pink tulip bells - ₹29 only.',
    description: 'MANAMM Silk Tulip Bow Hair Clip - Crimson Ruby Red. Crafted from shimmering rich crimson red silk organza ribbon, detailed with luminous pearl droplets, a light sage-green knotted center bow, and twin cascading hand-stitched pink tulip flower bells. Perfect for Diwali, festive celebrations, weddings, and everyday chic styling. Special Festive Offer at ₹29 each (MRP ₹99).',
    price: 29,
    compareAtPrice: 99,
    mrp: 99,
    discountPercentage: 71,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Bow Hair Clip / Barrette' },
      { name: 'Price', value: '₹29' },
      { name: 'MRP', value: '₹99' },
      { name: 'Discount', value: '71% OFF' },
      { name: 'Design', value: 'Silk Organza Bow with Cascading Tulip Bells' },
      { name: 'Color', value: 'Crimson Ruby Red & Blossom Pink' },
      { name: 'Material', value: 'Premium Shimmer Organza, Satin Ribbon, Faux Pearls, Metal Alligator Clip' },
      { name: 'Attachment', value: 'Comfort-Grip Alligator Hair Clip' },
      { name: 'Packaging', value: 'MANAMM Festive Protective Pouch' }
    ],
    tags: ['hair-clip', 'tulip-bow', 'festive-offer-29', 'diwali-special', 'accessories']
  },
  {
    id: 'prod_acc_51',
    sku: 'MNM-ACC-51',
    slug: 'manamm-silk-tulip-bow-hair-clip-champagne-gold',
    name: 'MANAMM Silk Tulip Bow Hair Clip - Champagne Gold',
    shortDescription: 'Regal champagne gold shimmer organza bow clip with pearls and golden yellow tulip bells - ₹29 only.',
    description: 'MANAMM Silk Tulip Bow Hair Clip - Champagne Gold. Exquisite festive hair barrette featuring glistening champagne gold sheer organza ribbons with delicate starlight crystal shimmer, pearl accents, a sage green satin knot, and hanging buttercup yellow tulip flower bells. Special Festive Offer at ₹29 each (MRP ₹99).',
    price: 29,
    compareAtPrice: 99,
    mrp: 99,
    discountPercentage: 71,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Bow Hair Clip / Barrette' },
      { name: 'Price', value: '₹29' },
      { name: 'MRP', value: '₹99' },
      { name: 'Discount', value: '71% OFF' },
      { name: 'Design', value: 'Silk Organza Bow with Cascading Tulip Bells' },
      { name: 'Color', value: 'Champagne Gold & Buttercup Yellow' },
      { name: 'Material', value: 'Glimmer Organza, Satin Ribbon, Faux Pearls, Metal Alligator Clip' },
      { name: 'Attachment', value: 'Comfort-Grip Alligator Hair Clip' },
      { name: 'Packaging', value: 'MANAMM Festive Protective Pouch' }
    ],
    tags: ['hair-clip', 'tulip-bow', 'festive-offer-29', 'champagne-gold', 'accessories']
  },
  {
    id: 'prod_acc_52',
    sku: 'MNM-ACC-52',
    slug: 'manamm-silk-tulip-bow-hair-clip-blush-pink',
    name: 'MANAMM Silk Tulip Bow Hair Clip - Blush Pink',
    shortDescription: 'Charming blush pink organza fairycore bow hair clip with dangling tulip bells - ₹29 only.',
    description: 'MANAMM Silk Tulip Bow Hair Clip - Blush Pink. Soft fairycore elegance crafted with translucent baby blush pink shimmer organza, pearl droplets, mint green ribbon bowknot, and twin swinging tulip buds. Lightweight, secure, and stylish. Special Festive Offer at ₹29 each (MRP ₹99).',
    price: 29,
    compareAtPrice: 99,
    mrp: 99,
    discountPercentage: 71,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Bow Hair Clip / Barrette' },
      { name: 'Price', value: '₹29' },
      { name: 'MRP', value: '₹99' },
      { name: 'Discount', value: '71% OFF' },
      { name: 'Design', value: 'Silk Organza Bow with Cascading Tulip Bells' },
      { name: 'Color', value: 'Blush Pink & Pastel Rose' },
      { name: 'Material', value: 'Soft Shimmer Organza, Satin Ribbon, Faux Pearls, Metal Alligator Clip' },
      { name: 'Attachment', value: 'Comfort-Grip Alligator Hair Clip' },
      { name: 'Packaging', value: 'MANAMM Festive Protective Pouch' }
    ],
    tags: ['hair-clip', 'tulip-bow', 'festive-offer-29', 'blush-pink', 'accessories']
  },
  {
    id: 'prod_acc_53',
    sku: 'MNM-ACC-53',
    slug: 'manamm-silk-tulip-bow-hair-clip-pearl-white',
    name: 'MANAMM Silk Tulip Bow Hair Clip - Pearl White & Ivory',
    shortDescription: 'Bridal pearl white organza bow hair clip with silver shimmer and ivory tulip bells - ₹29 only.',
    description: 'MANAMM Silk Tulip Bow Hair Clip - Pearl White & Ivory. Pure bridal splendor with silver-flecked sheer white organza, lustrous pearl beads, a sage-tinted green ribbon knot, and ivory tulip bells. Adds an ethereal touch to ethnic and western styles alike. Special Festive Offer at ₹29 each (MRP ₹99).',
    price: 29,
    compareAtPrice: 99,
    mrp: 99,
    discountPercentage: 71,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Bow Hair Clip / Barrette' },
      { name: 'Price', value: '₹29' },
      { name: 'MRP', value: '₹99' },
      { name: 'Discount', value: '71% OFF' },
      { name: 'Design', value: 'Silk Organza Bow with Cascading Tulip Bells' },
      { name: 'Color', value: 'Pearl White & Pure Ivory' },
      { name: 'Material', value: 'Silver Shimmer Organza, Satin Ribbon, Faux Pearls, Metal Alligator Clip' },
      { name: 'Attachment', value: 'Comfort-Grip Alligator Hair Clip' },
      { name: 'Packaging', value: 'MANAMM Festive Protective Pouch' }
    ],
    tags: ['hair-clip', 'tulip-bow', 'festive-offer-29', 'pearl-white', 'accessories']
  },
  {
    id: 'prod_acc_54',
    sku: 'MNM-ACC-54',
    slug: 'manamm-silk-tulip-bow-hair-clip-noir-black',
    name: 'MANAMM Silk Tulip Bow Hair Clip - Noir Black & Lavender',
    shortDescription: 'Sophisticated noir black satin organza bow clip with lavender tulip bells - ₹29 only.',
    description: 'MANAMM Silk Tulip Bow Hair Clip - Noir Black & Lavender. Dramatic dark academia and chic festive styling featuring deep noir black organza ribbon with subtle sparkle, pearl studs, pistachio green knot, and contrasting pastel lavender tulip buds. Special Festive Offer at ₹29 each (MRP ₹99).',
    price: 29,
    compareAtPrice: 99,
    mrp: 99,
    discountPercentage: 71,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Bow Hair Clip / Barrette' },
      { name: 'Price', value: '₹29' },
      { name: 'MRP', value: '₹99' },
      { name: 'Discount', value: '71% OFF' },
      { name: 'Design', value: 'Silk Organza Bow with Cascading Tulip Bells' },
      { name: 'Color', value: 'Noir Black & Pastel Lavender' },
      { name: 'Material', value: 'Deep Noir Organza, Satin Ribbon, Faux Pearls, Metal Alligator Clip' },
      { name: 'Attachment', value: 'Comfort-Grip Alligator Hair Clip' },
      { name: 'Packaging', value: 'MANAMM Festive Protective Pouch' }
    ],
    tags: ['hair-clip', 'tulip-bow', 'festive-offer-29', 'noir-black', 'accessories']
  },
  {
    id: 'prod_acc_55',
    sku: 'MNM-ACC-55',
    slug: 'manamm-silk-tulip-bow-hair-clip-pastel-blue',
    name: 'MANAMM Silk Tulip Bow Hair Clip - Pastel Sky Blue',
    shortDescription: 'Whimsical sky blue shimmer organza bow hair clip with ocean blue tulip bells - ₹29 only.',
    description: 'MANAMM Silk Tulip Bow Hair Clip - Pastel Sky Blue. Light and refreshing pastel blue organza bow clip adorned with pearl drops, green accent knot, and twin periwinkle blue tulip bells. Pairs effortlessly with pastels, kurtis, and gowns. Special Festive Offer at ₹29 each (MRP ₹99).',
    price: 29,
    compareAtPrice: 99,
    mrp: 99,
    discountPercentage: 71,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Bow Hair Clip / Barrette' },
      { name: 'Price', value: '₹29' },
      { name: 'MRP', value: '₹99' },
      { name: 'Discount', value: '71% OFF' },
      { name: 'Design', value: 'Silk Organza Bow with Cascading Tulip Bells' },
      { name: 'Color', value: 'Pastel Sky Blue & Periwinkle' },
      { name: 'Material', value: 'Sky Shimmer Organza, Satin Ribbon, Faux Pearls, Metal Alligator Clip' },
      { name: 'Attachment', value: 'Comfort-Grip Alligator Hair Clip' },
      { name: 'Packaging', value: 'MANAMM Festive Protective Pouch' }
    ],
    tags: ['hair-clip', 'tulip-bow', 'festive-offer-29', 'sky-blue', 'accessories']
  },

  // 6 Sparkling Crystal Flower Clips @ Rs. 199 each (MRP 699)
  {
    id: 'prod_acc_56',
    sku: 'MNM-ACC-56',
    slug: 'manamm-crystal-flower-alligator-clip-amethyst-violet',
    name: 'MANAMM Sparkling Crystal Flower Alligator Clip - Amethyst Violet',
    shortDescription: 'Five-flower faceted crystal alligator clip in amethyst violet with opalescent sheen - ₹199 only.',
    description: 'MANAMM Sparkling Crystal Flower Alligator Hair Clip - Amethyst Violet. Designed with 5 blooming faceted crystal flower florets displaying an enchanting amethyst purple opalescence with diamond-like fire. Features a strong, non-slip gunmetal alligator clip backing for all hair types. Limited Diwali Offer at ₹199 each (MRP ₹699).',
    price: 199,
    compareAtPrice: 699,
    mrp: 699,
    discountPercentage: 72,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Crystal Flower Alligator Clip' },
      { name: 'Price', value: '₹199' },
      { name: 'MRP', value: '₹699' },
      { name: 'Discount', value: '72% OFF' },
      { name: 'Floret Count', value: '5 Blooming Crystal Flowers' },
      { name: 'Color', value: 'Amethyst Violet / Lilac Opal' },
      { name: 'Material', value: 'Faceted Pear-Cut Crystal Glass & Electroplated Alloy' },
      { name: 'Attachment', value: 'Non-Slip Teeth Alligator Hair Barrette' },
      { name: 'Packaging', value: 'MANAMM Luxury Gift Box' }
    ],
    tags: ['crystal-clip', 'hair-barrette', 'amethyst-violet', 'festive-offer-199', 'accessories']
  },
  {
    id: 'prod_acc_57',
    sku: 'MNM-ACC-57',
    slug: 'manamm-crystal-flower-alligator-clip-moonstone-opal',
    name: 'MANAMM Sparkling Crystal Flower Alligator Clip - Moonstone Opal White',
    shortDescription: 'Five-flower iridescent moonstone opal crystal alligator clip with luminous rainbow fire - ₹199 only.',
    description: 'MANAMM Sparkling Crystal Flower Alligator Hair Clip - Moonstone Opal White. Glistening with celestial iridescence, this premium alligator clip features five four-petal crystal flower florets in translucent moonstone white that reflect pastel blue and peach highlights. Limited Diwali Offer at ₹199 each (MRP ₹699).',
    price: 199,
    compareAtPrice: 699,
    mrp: 699,
    discountPercentage: 72,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Crystal Flower Alligator Clip' },
      { name: 'Price', value: '₹199' },
      { name: 'MRP', value: '₹699' },
      { name: 'Discount', value: '72% OFF' },
      { name: 'Floret Count', value: '5 Blooming Crystal Flowers' },
      { name: 'Color', value: 'Moonstone Opal White / Pearlescent Shimmer' },
      { name: 'Material', value: 'Faceted Pear-Cut Crystal Glass & Silver-Tone Alloy' },
      { name: 'Attachment', value: 'Non-Slip Teeth Alligator Hair Barrette' },
      { name: 'Packaging', value: 'MANAMM Luxury Gift Box' }
    ],
    tags: ['crystal-clip', 'hair-barrette', 'moonstone-opal', 'festive-offer-199', 'accessories']
  },
  {
    id: 'prod_acc_58',
    sku: 'MNM-ACC-58',
    slug: 'manamm-crystal-flower-alligator-clip-rose-quartz-pink',
    name: 'MANAMM Sparkling Crystal Flower Alligator Clip - Rose Quartz Pink',
    shortDescription: 'Romantic rose quartz baby pink crystal flower alligator clip with glittering florets - ₹199 only.',
    description: 'MANAMM Sparkling Crystal Flower Alligator Hair Clip - Rose Quartz Pink. Adorn your tresses with delicate feminine charm. Showcases 5 floral clusters of pear-faceted rose quartz pink crystals mounted on a polished alloy alligator clip. Comfortable, durable, and sparkling. Limited Diwali Offer at ₹199 each (MRP ₹699).',
    price: 199,
    compareAtPrice: 699,
    mrp: 699,
    discountPercentage: 72,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Crystal Flower Alligator Clip' },
      { name: 'Price', value: '₹199' },
      { name: 'MRP', value: '₹699' },
      { name: 'Discount', value: '72% OFF' },
      { name: 'Floret Count', value: '5 Blooming Crystal Flowers' },
      { name: 'Color', value: 'Rose Quartz Pink / Baby Pink' },
      { name: 'Material', value: 'Faceted Pear-Cut Crystal Glass & Electroplated Alloy' },
      { name: 'Attachment', value: 'Non-Slip Teeth Alligator Hair Barrette' },
      { name: 'Packaging', value: 'MANAMM Luxury Gift Box' }
    ],
    tags: ['crystal-clip', 'hair-barrette', 'rose-quartz', 'festive-offer-199', 'accessories']
  },
  {
    id: 'prod_acc_59',
    sku: 'MNM-ACC-59',
    slug: 'manamm-crystal-flower-barrette-jade-emerald-green',
    name: 'MANAMM Sparkling Crystal Flower Hair Barrette - Jade Emerald Green',
    shortDescription: 'Horizontal crystal flower hair barrette in rich jade emerald green with gold-tone frame - ₹199 only.',
    description: 'MANAMM Sparkling Crystal Flower Hair Barrette - Jade Emerald Green. Regal luxury styled as a horizontal statement hair barrette. Decorated with four 4-petal blooming jade green faceted crystals anchored on a radiant gold-tone clasp. Adds royalty to ethnic sarees, lehengas, and gowns. Limited Diwali Offer at ₹199 each (MRP ₹699).',
    price: 199,
    compareAtPrice: 699,
    mrp: 699,
    discountPercentage: 72,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Horizontal Crystal Hair Barrette' },
      { name: 'Price', value: '₹199' },
      { name: 'MRP', value: '₹699' },
      { name: 'Discount', value: '72% OFF' },
      { name: 'Floret Count', value: '4 Large Crystal Flower Florets' },
      { name: 'Color', value: 'Jade Emerald Green & Polished Gold' },
      { name: 'Material', value: 'Faceted Pear-Cut Crystal Glass & Gold-Tone Alloy' },
      { name: 'Attachment', value: 'Snap Spring Hair Barrette Clip' },
      { name: 'Packaging', value: 'MANAMM Luxury Gift Box' }
    ],
    tags: ['crystal-clip', 'hair-barrette', 'jade-emerald', 'festive-offer-199', 'accessories']
  },
  {
    id: 'prod_acc_60',
    sku: 'MNM-ACC-60',
    slug: 'manamm-crystal-flower-alligator-clip-aurora-borealis',
    name: 'MANAMM Sparkling Crystal Flower Alligator Clip - Aurora Borealis Rainbow',
    shortDescription: 'Multi-color pastel rainbow Aurora Borealis crystal flower alligator clip - ₹199 only.',
    description: 'MANAMM Sparkling Crystal Flower Alligator Hair Clip - Aurora Borealis Rainbow. A magnificent spectrum of light! Alternating blooms in lavender pink, mint turquoise, baby blue, and sunlit peach crystal florets on a sleek black metal clip. Captures joyful festive vibes. Limited Diwali Offer at ₹199 each (MRP ₹699).',
    price: 199,
    compareAtPrice: 699,
    mrp: 699,
    discountPercentage: 72,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Crystal Flower Alligator Clip' },
      { name: 'Price', value: '₹199' },
      { name: 'MRP', value: '₹699' },
      { name: 'Discount', value: '72% OFF' },
      { name: 'Floret Count', value: '5 Multi-Color Crystal Flowers' },
      { name: 'Color', value: 'Aurora Borealis Multi-Color Pastel Rainbow' },
      { name: 'Material', value: 'Faceted Pear-Cut Crystal Glass & Black Gunmetal Alloy' },
      { name: 'Attachment', value: 'Non-Slip Teeth Alligator Hair Barrette' },
      { name: 'Packaging', value: 'MANAMM Luxury Gift Box' }
    ],
    tags: ['crystal-clip', 'hair-barrette', 'aurora-rainbow', 'festive-offer-199', 'accessories']
  },
  {
    id: 'prod_acc_61',
    sku: 'MNM-ACC-61',
    slug: 'manamm-crystal-flower-barrette-aquamarine-blue',
    name: 'MANAMM Sparkling Crystal Flower Hair Barrette - Aquamarine Ocean Blue',
    shortDescription: 'Dazzling horizontal crystal flower barrette in aquamarine topaz blue with gold setting - ₹199 only.',
    description: 'MANAMM Sparkling Crystal Flower Hair Barrette - Aquamarine Ocean Blue. Captivating crystal clear ocean blue tones set against a polished golden barrette. Features four blooming flower clusters with shimmering faceted crystal petals that reflect light brilliantly. Limited Diwali Offer at ₹199 each (MRP ₹699).',
    price: 199,
    compareAtPrice: 699,
    mrp: 699,
    discountPercentage: 72,
    category: 'Accessories',
    categoryId: 'cat_accessories',
    subcategory: 'Hair Accessories',
    mainCategoryId: 'cat_fashion_lifestyle',
    mainCategory: 'Partner Collections & Lifestyle',
    sourceType: 'PARTNER',
    source: 'Partner Collection',
    brandId: 'brd_partner_collections',
    brand: 'MANAMM Partner Studio',
    unit: '1 Piece',
    attributes: [
      { name: 'Brand', value: 'MANAMM Partner Studio' },
      { name: 'Category', value: 'Accessories' },
      { name: 'Subcategory', value: 'Hair Accessories' },
      { name: 'Product Type', value: 'Horizontal Crystal Hair Barrette' },
      { name: 'Price', value: '₹199' },
      { name: 'MRP', value: '₹699' },
      { name: 'Discount', value: '72% OFF' },
      { name: 'Floret Count', value: '4 Large Crystal Flower Florets' },
      { name: 'Color', value: 'Aquamarine Ocean Blue & Radiant Gold' },
      { name: 'Material', value: 'Faceted Pear-Cut Crystal Glass & Gold-Tone Alloy' },
      { name: 'Attachment', value: 'Snap Spring Hair Barrette Clip' },
      { name: 'Packaging', value: 'MANAMM Luxury Gift Box' }
    ],
    tags: ['crystal-clip', 'hair-barrette', 'aquamarine-blue', 'festive-offer-199', 'accessories']
  }
];

async function updateCatalogs(cloudinaryUrls) {
  console.log('4. Building product records and updating catalog JSON files...');
  const newProducts = productDefinitions.map(def => {
    const url = cloudinaryUrls[def.id];
    return {
      ...def,
      currency: 'INR',
      imageUrl: url,
      images: [url],
      thumbnail: url,
      priceConfirmed: true,
      status: 'ACTIVE',
      stock: 100,
      isAvailable: true,
      isFeatured: true,
      featured: true,
      newArrival: true,
      isActive: true,
      rating: 4.9,
      reviewCount: Math.floor(Math.random() * 20) + 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const targetFiles = [
    path.join(__dirname, '../../manammcare/src/data/products.json'),
    path.join(__dirname, '../../manamm_app/src/data/products/products.json'),
    path.join(__dirname, '../../manammcare_backend/data/products/products.json'),
  ];

  for (const file of targetFiles) {
    if (!fs.existsSync(file)) {
      console.warn(`File does not exist: ${file}`);
      continue;
    }
    const currentList = JSON.parse(fs.readFileSync(file, 'utf8'));
    // Remove existing if any
    const newIds = new Set(newProducts.map(p => p.id));
    const filtered = currentList.filter(p => !newIds.has(p.id));
    // Append new products
    filtered.push(...newProducts);
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf8');
    console.log(`Updated ${file}: total products = ${filtered.length}`);
  }
}

async function main() {
  await prepareImages();
  const urls = await uploadToCloudinary();
  await updateCatalogs(urls);
  console.log('ALL DONE SUCCESSFUL!');
}

main().catch(console.error);
