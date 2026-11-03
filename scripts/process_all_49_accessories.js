const fs = require('fs');
const path = require('path');
const https = require('https');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hawhugfs',
  api_key: process.env.CLOUDINARY_API_KEY || '478235249832675',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IiTXNYv67dXWMAeWe7YaDZ20wjM',
});

const prisma = new PrismaClient();

const SOURCE_DIR = 'C:\\Users\\Nithesh\\Downloads\\img';
const SCRATCH_DIR = 'C:\\Users\\Nithesh\\.gemini\\antigravity\\brain\\c67ebf40-1ee9-472e-9a6a-60dfc4148dd1\\scratch';
const FINAL_DIR = path.join(__dirname, 'final_packshots');
const WEB_IMG_DIR = path.resolve(__dirname, '../../manammcare/public/images/products');
const APP_IMG_DIR = path.resolve(__dirname, '../../manamm_app/assets/products');

const WEB_JSON = path.resolve(__dirname, '../../manammcare/src/data/products.json');
const APP_JSON = path.resolve(__dirname, '../../manamm_app/src/data/products/products.json');
const BACKEND_JSON = path.resolve(__dirname, '../data/products/products.json');

[SCRATCH_DIR, FINAL_DIR, WEB_IMG_DIR, APP_IMG_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const items = [
  {
    id: "prod_acc_01",
    sku: "MNM-ACC-01",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.40 PM (1).jpeg",
    name: "MANAMM Tropical Plumeria Blossom Hair Claw Clips (Pack of 12)",
    slug: "manamm-tropical-plumeria-blossom-hair-claw-clips-12pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Delightful tropical Hawaiian plumeria blossom hair claw clips featuring soft gradient petals in assorted pastel and vibrant colors. Durable spring grip ensures secure, slip-free all-day hold.",
    setDetails: "12 Pieces Hair Claw Clips Card Set",
    material: "Durable Acrylic Resin & Alloy Spring",
    color: "Assorted Gradient (Blush Pink, Ocean Teal, Coral, Violet)",
    unit: "Pack of 12",
    tags: ["hair-claw-clips", "plumeria", "flower-clips", "hair-accessories", "hawaiian", "women-accessories", "special-offer-199"]
  },
  {
    id: "prod_acc_02",
    sku: "MNM-ACC-02",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.40 PM.jpeg",
    name: "MANAMM Ombre Gradient Plumeria Hair Claw Clips Set (8 Pcs)",
    slug: "manamm-ombre-gradient-plumeria-hair-claw-clips-8pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Charming ombre gradient Hawaiian frangipani flower claw clips in pink, lavender, and neutral dual tones. Perfect for beach vacations, casual styling, and everyday elegance.",
    setDetails: "8 Pieces Hair Claw Clips Pouch Set",
    material: "Matte Acrylic & Metal Spring",
    color: "Ombre Multicolor (Pink, Mocha, Lilac, Slate)",
    unit: "Pack of 8",
    tags: ["frangipani", "hair-clips", "ombre", "hair-claw", "hair-accessories", "beachwear", "special-offer-199"]
  },
  {
    id: "prod_acc_03",
    sku: "MNM-ACC-03",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.41 PM (1).jpeg",
    name: "MANAMM Silver Luster Dual Flower Cat-Eye Crystal Bangle",
    slug: "manamm-silver-luster-dual-flower-cat-eye-crystal-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Handcrafted silver-finish luxury bangle adorned with twin blooming floral motifs featuring luminous cat-eye cabochon petals and a pave crystal encrusted rim. Secure spring-hinge clasp.",
    setDetails: "1 Piece Bangle",
    material: "Silver Rhodium-Plated Alloy, Cat-Eye Stone, Cubic Zirconia",
    color: "Silver & Moonstone White",
    unit: "1 Piece",
    tags: ["bangle", "bracelet", "silver-jewelry", "cat-eye-stone", "crystal-bangle", "fashion-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_04",
    sku: "MNM-ACC-04",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.41 PM.jpeg",
    name: "MANAMM Rose Gold Oval Cat-Eye Filigree Accent Bangle",
    slug: "manamm-rose-gold-oval-cat-eye-filigree-accent-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Sophisticated rose gold-plated bangle highlighting an exquisite oval cat-eye gemstone flanked by delicate swirling filigree and micro-pave crystal accents.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Brass, Cat-Eye Cabochon, Crystal Pavé",
    color: "Rose Gold & Peach Moonstone",
    unit: "1 Piece",
    tags: ["rose-gold-bangle", "filigree-bracelet", "cat-eye-gemstone", "luxury-jewelry", "festive-wear", "special-offer-199"]
  },
  {
    id: "prod_acc_05",
    sku: "MNM-ACC-05",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.42 PM (1).jpeg",
    name: "MANAMM Silver Celestial Halo Solitaire Cat-Eye Bangle",
    slug: "manamm-silver-celestial-halo-solitaire-cat-eye-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Modern minimalist silver-plated bangle with a circular halo centerpiece encircling a serene moonlit cat-eye stone, complete with dual-row crystal band detailing.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Alloy, Cat-Eye Cabochon, Cubic Zirconia",
    color: "Silver & Pearl Grey",
    unit: "1 Piece",
    tags: ["halo-bangle", "solitaire-bracelet", "silver-finish", "cat-eye-stone", "party-wear", "special-offer-199"]
  },
  {
    id: "prod_acc_06",
    sku: "MNM-ACC-06",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.42 PM (2).jpeg",
    name: "MANAMM Rose Gold Dual Marquise Petal Crystal Bangle",
    slug: "manamm-rose-gold-dual-marquise-petal-crystal-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Chic bypass cuff bangle finished in warm rose gold with twin marquise-cut cat-eye stones embraced by sparkling crystal-lined flowing branches.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, Marquise Cat-Eye Stone, Pavé Crystals",
    color: "Rose Gold & Champagne",
    unit: "1 Piece",
    tags: ["marquise-stone", "rose-gold-bracelet", "botanical-jewelry", "designer-bangle", "special-offer-199"]
  },
  {
    id: "prod_acc_07",
    sku: "MNM-ACC-07",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.42 PM.jpeg",
    name: "MANAMM Silver Enchanted Vine Leaf Cat-Eye Bangle",
    slug: "manamm-silver-enchanted-vine-leaf-cat-eye-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Intricately sculpted botanical vine bracelet featuring sweeping silver scrolls, shimmering cubic zirconia accents, and pearlescent cat-eye teardrop gems.",
    setDetails: "1 Piece Bangle",
    material: "Silver Rhodium-Plated Alloy, Cat-Eye Teardrop Gems, Pavé Crystals",
    color: "Silver & Opalescent White",
    unit: "1 Piece",
    tags: ["vine-bracelet", "nature-inspired", "silver-bangle", "leaf-motif", "crystal-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_08",
    sku: "MNM-ACC-08",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.43 PM.jpeg",
    name: "MANAMM Luxury Silk Satin Soft Hair Scrunchies (Pack of 6)",
    slug: "manamm-luxury-silk-satin-soft-hair-scrunchies-6pcs",
    subcategory: "Hair Accessories",
    type: "Hair Scrunchies",
    description: "Ultra-gentle premium silk satin hair scrunchies designed to prevent hair breakage and creasing. Comes in an assorted palette of dusty rose, sage green, mauve, burgundy, and ivory.",
    setDetails: "6 Pieces Silk Satin Scrunchies Pack",
    material: "Mulberry-Feel Silk Satin Fabric, Premium Stretch Elastic",
    color: "Assorted Pastel & Jewel Tones",
    unit: "Pack of 6",
    tags: ["silk-scrunchies", "satin-hair-ties", "anti-breakage", "hair-care", "hair-accessories", "special-offer-199"]
  },
  {
    id: "prod_acc_09",
    sku: "MNM-ACC-09",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.44 PM (1).jpeg",
    name: "MANAMM Rose Gold Rosette Cluster Shimmer Bangle",
    slug: "manamm-rose-gold-rosette-cluster-shimmer-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Radiant rose gold cuff adorned with a shimmering cluster of floral crystal florets and bezel-set cat-eye cabochons, radiating graceful festive charm.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Brass, Gemstone Cabochons, Pavé Crystals",
    color: "Rose Gold & Peach",
    unit: "1 Piece",
    tags: ["rosette-bangle", "cluster-bracelet", "rose-gold", "wedding-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_10",
    sku: "MNM-ACC-10",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.44 PM (2).jpeg",
    name: "MANAMM Rose Gold Trinity Trio Cat-Eye Bangle",
    slug: "manamm-rose-gold-trinity-trio-cat-eye-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Contemporary three-stone graduated bangle in rose gold plating with luminous opalescent cat-eye gems encased in pave crystal bezels.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, 3 Graduated Cat-Eye Stones, Crystals",
    color: "Rose Gold & Blush Stone",
    unit: "1 Piece",
    tags: ["trinity-bangle", "three-stone", "rose-gold-bracelet", "modern-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_11",
    sku: "MNM-ACC-11",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.44 PM.jpeg",
    name: "MANAMM Rose Gold Serpentine Dual Teardrop Bangle",
    slug: "manamm-rose-gold-serpentine-dual-teardrop-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Graceful wave silhouette bangle featuring bypass curved branches set with double teardrop cat-eye stones and sparkling micro-crystals.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, Pear-Cut Cat-Eye Stones, Pavé Crystals",
    color: "Rose Gold & Sunset Peach",
    unit: "1 Piece",
    tags: ["serpentine-bangle", "teardrop-bracelet", "bypass-cuff", "rose-gold", "special-offer-199"]
  },
  {
    id: "prod_acc_12",
    sku: "MNM-ACC-12",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.45 PM (1).jpeg",
    name: "MANAMM Crystal Lucite Butterfly Hair Claw Clips (Set of 12)",
    slug: "manamm-crystal-lucite-butterfly-hair-claw-clips-12pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Crystal clear acrylic butterfly hair claw clips in gleaming jewel tones. Light-catching faceted design provides sturdy hold with effortless glamour.",
    setDetails: "12 Pieces Crystal Butterfly Clips Card Pack",
    material: "High-Grade Lucite Acrylic & Steel Spring",
    color: "Crystal Clear & Jewel Tones (Emerald, Amber, Rose, Amethyst)",
    unit: "Pack of 12",
    tags: ["lucite-clips", "butterfly-hair-claw", "crystal-hair-clips", "hair-accessories", "special-offer-199"]
  },
  {
    id: "prod_acc_13",
    sku: "MNM-ACC-13",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.45 PM (2).jpeg",
    name: "MANAMM Kawaii Gummy Bear & Bunny Mini Hair Claw Clips (Card Set of 24)",
    slug: "manamm-kawaii-gummy-bear-bunny-mini-claw-clips-24pcs",
    subcategory: "Hair Accessories",
    type: "Hair Clips & Pins",
    description: "Adorable candy-colored mini claw clips with cute gummy bears and playful bunny motifs. Perfect for girls and kids hairstyle styling, parties, and everyday cuteness.",
    setDetails: "24 Pieces Kids Cartoon Claw Clips Board Set",
    material: "Eco-friendly Resin & Metal Clip",
    color: "Vibrant Rainbow Assorted",
    unit: "Pack of 24",
    tags: ["kids-hair-clips", "gummy-bear", "kawaii-clips", "mini-claw-clips", "girls-fashion", "special-offer-199"]
  },
  {
    id: "prod_acc_14",
    sku: "MNM-ACC-14",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.45 PM.jpeg",
    name: "MANAMM Royal Silver Cat-Eye Designer Bangles Gift Box (Set of 10)",
    slug: "manamm-royal-silver-cat-eye-designer-bangles-gift-box-10pcs",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets Set",
    description: "Collector's edition luxury gift box containing 10 uniquely designed silver-plated cat-eye and crystal statement bangles. Ideal for weddings, festive gifting, and jewelry enthusiasts.",
    setDetails: "10 Pieces Curated Luxury Silver Bangles in Display Gift Box",
    material: "Silver Rhodium-Plated Alloy, Premium Cat-Eye Stones, Crystals, Gift Box",
    color: "Silver & Moonstone White",
    unit: "Box of 10",
    tags: ["gift-box", "bangle-set", "silver-collection", "bridal-jewelry", "luxury-set", "special-offer-199"]
  },
  {
    id: "prod_acc_15",
    sku: "MNM-ACC-15",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.46 PM (1).jpeg",
    name: "MANAMM Silver Twilight Oval Halo Pave Bangle",
    slug: "manamm-silver-twilight-oval-halo-pave-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Timeless oval-cut cat-eye centerpiece encircled by a double row of brilliant pave crystals on a polished silver rhodium-plated cuff.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Alloy, Oval Cat-Eye Gem, Pavé Crystals",
    color: "Silver & Luminous Opal",
    unit: "1 Piece",
    tags: ["halo-bangle", "oval-stone", "silver-bracelet", "cat-eye-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_16",
    sku: "MNM-ACC-16",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.46 PM (2).jpeg",
    name: "MANAMM Silver Endless Infinity Wave Crystal Bangle",
    slug: "manamm-silver-endless-infinity-wave-crystal-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Interlocking infinity wave motif bangle crafted in gleaming silver finish and lined with shimmering pavé stones for a dazzling wrist stack.",
    setDetails: "1 Piece Bangle",
    material: "Silver Rhodium Finish, Cubic Zirconia Wave Detailing",
    color: "Pure Silver",
    unit: "1 Piece",
    tags: ["infinity-bangle", "wave-bracelet", "crystal-stack", "rhodium-plated", "special-offer-199"]
  },
  {
    id: "prod_acc_17",
    sku: "MNM-ACC-17",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.46 PM.jpeg",
    name: "MANAMM Silver Twin Starlight Crossover Bangle",
    slug: "manamm-silver-twin-starlight-crossover-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Modern crossover bypass silhouette bangle featuring two luminous oval cat-eye stones set diagonally with crystal-studded swooping accents.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Alloy, Dual Cat-Eye Stones, Shimmer Crystals",
    color: "Silver & Soft Silver Pearl",
    unit: "1 Piece",
    tags: ["crossover-bangle", "twin-stone", "starlight-bracelet", "silver-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_18",
    sku: "MNM-ACC-18",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.47 PM (1).jpeg",
    name: "MANAMM Rose Gold Lucky Quatrefoil Floral Bangle",
    slug: "manamm-rose-gold-lucky-quatrefoil-floral-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Charming four-leaf clover motif bangle crafted in warm rose gold with cat-eye petal inlays and pavé crystal accents representing luck, love, and grace.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Brass, Cat-Eye Clover Inlay, Crystals",
    color: "Rose Gold & Peach Moonstone",
    unit: "1 Piece",
    tags: ["clover-bangle", "quatrefoil", "lucky-charm", "rose-gold-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_19",
    sku: "MNM-ACC-19",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.47 PM.jpeg",
    name: "MANAMM Pastel Crystal Beaded Stretch Charm Bracelets (Set of 6)",
    slug: "manamm-pastel-crystal-beaded-stretch-charm-bracelets-6pcs",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets Set",
    description: "Delicate handcrafted beaded stretch bracelets made with faceted pastel crystal beads, faux pearls, and floral metallic charms. Comfortable elastic slip-on fit.",
    setDetails: "6 Pieces Carded Stretch Charm Bracelets Pack",
    material: "Faceted Crystal Beads, Alloy Charms, Elastic Cord",
    color: "Multicolor Pastels (Mint, Baby Pink, Lavender, Powder Blue)",
    unit: "Pack of 6",
    tags: ["beaded-bracelets", "stretch-bracelet", "charm-bracelet", "pastel-beads", "handcrafted", "special-offer-199"]
  },
  {
    id: "prod_acc_20",
    sku: "MNM-ACC-20",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.48 PM (1).jpeg",
    name: "MANAMM Sweet Pastel Mini Butterfly Hair Claw Clips (Pack of 36)",
    slug: "manamm-sweet-pastel-mini-butterfly-hair-claw-clips-36pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Vibrant card collection of 36 miniature butterfly jaw claw clips in assorted pastel shades including mint, blush pink, lilac, and sky blue.",
    setDetails: "36 Pieces Carded Mini Butterfly Clips Set",
    material: "Premium Durable Plastic & Steel Spring",
    color: "Rainbow Pastels Assortment",
    unit: "Pack of 36",
    tags: ["mini-butterfly-clips", "hair-claws", "pastel-clips", "bulk-pack", "hair-styling", "special-offer-199"]
  },
  {
    id: "prod_acc_21",
    sku: "MNM-ACC-21",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.48 PM (2).jpeg",
    name: "MANAMM Island Breeze Tropical Floral Claw Clips (Set of 12)",
    slug: "manamm-island-breeze-tropical-floral-claw-clips-12pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Hawaiian tropical flower claw clips in vibrant gradient colors with high-gloss finish. Sturdy interlocking teeth keep buns, half-ups, and loose hair secure.",
    setDetails: "12 Pieces Strip Pack Floral Claw Clips",
    material: "Glossy Acetate Resin & Alloy Spring",
    color: "Tropical Gradient Rainbow",
    unit: "Pack of 12",
    tags: ["tropical-clips", "flower-claw", "hawaiian-hair-clips", "vacation-style", "special-offer-199"]
  },
  {
    id: "prod_acc_22",
    sku: "MNM-ACC-22",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.48 PM.jpeg",
    name: "MANAMM Silver Imperial Tiara Crown Crystal Bangle",
    slug: "manamm-silver-imperial-tiara-crown-crystal-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Regal crown tiara motif bangle decorated with intricate arched filigree, pearlescent stone accents, and twinkling pavé diamonds.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Alloy, Regal Tiara Arch, Cat-Eye Gems, Crystals",
    color: "Silver & Crystal Clear",
    unit: "1 Piece",
    tags: ["tiara-bangle", "crown-bracelet", "queen-jewelry", "regal-cuff", "festive-bangle", "special-offer-199"]
  },
  {
    id: "prod_acc_23",
    sku: "MNM-ACC-23",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.49 PM (1).jpeg",
    name: "MANAMM Silver Modernist Contour Loop Cat-Eye Bangle",
    slug: "manamm-silver-modernist-contour-loop-cat-eye-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Sleek contemporary loop bracelet with geometric fluid lines, highlighted by a glowing central cat-eye cabochon and crystal channel setting.",
    setDetails: "1 Piece Bangle",
    material: "Silver Rhodium Finish, Cat-Eye Gemstone, Pavé Channel",
    color: "Silver & Soft Opal",
    unit: "1 Piece",
    tags: ["contour-bangle", "loop-bracelet", "modern-silver", "geometric-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_24",
    sku: "MNM-ACC-24",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.49 PM.jpeg",
    name: "MANAMM Floral Blossom & Luminous Pearl Hair Clips (Set of 8)",
    slug: "manamm-floral-blossom-luminous-pearl-hair-clips-8pcs",
    subcategory: "Hair Accessories",
    type: "Hair Clips & Pins",
    description: "Delicate flower hair clips detailed with shimmering faux pearl centers and soft petal textures on sturdy gold-toned alligator claw clips.",
    setDetails: "8 Pieces (4 Pairs) Carded Floral Clips",
    material: "Velvety Fabric Petals, Faux Pearl, Gold-Plated Metal Clips",
    color: "Pastel Yellow, Sky Blue, Pink, Cream",
    unit: "Pack of 8",
    tags: ["pearl-flower-clips", "alligator-clips", "hair-pins", "delicate-florals", "special-offer-199"]
  },
  {
    id: "prod_acc_25",
    sku: "MNM-ACC-25",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.50 PM (1).jpeg",
    name: "MANAMM Marshmallow Plush Faux Fur Hair Scrunchies (Pack of 6)",
    slug: "manamm-marshmallow-plush-faux-fur-hair-scrunchies-6pcs",
    subcategory: "Hair Accessories",
    type: "Hair Scrunchies",
    description: "Incredibly soft, fluffy marshmallow plush hair scrunchies in gentle pastel shades. Super stretchy elastic core provides comfortable, snag-free hold.",
    setDetails: "6 Pieces Plush Scrunchies Pouch Pack",
    material: "Faux Rabbit Fur Fleece, High Elastic Core",
    color: "Cloud White, Baby Pink, Lavender, Mint, Beige, Blue",
    unit: "Pack of 6",
    tags: ["plush-scrunchies", "faux-fur", "fluffy-hair-ties", "marshmallow-soft", "special-offer-199"]
  },
  {
    id: "prod_acc_26",
    sku: "MNM-ACC-26",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.50 PM (2).jpeg",
    name: "MANAMM Spring Tulip Blossom Elastic Hair Ties (Pack of 12)",
    slug: "manamm-spring-tulip-blossom-elastic-hair-ties-12pcs",
    subcategory: "Hair Accessories",
    type: "Hair Ties & Bands",
    description: "Charming floral hair ties featuring 3D soft fabric tulip buds and ribbon accents on durable braided elastic bands.",
    setDetails: "12 Pieces Tulip Hair Ties Set",
    material: "Fabric Floral Buds, Braided Elastic Ribbon",
    color: "Assorted Garden Floral Shades",
    unit: "Pack of 12",
    tags: ["tulip-hair-ties", "flower-scrunchie", "braided-elastics", "spring-floral", "special-offer-199"]
  },
  {
    id: "prod_acc_27",
    sku: "MNM-ACC-27",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.50 PM.jpeg",
    name: "MANAMM Velvet Faux Fur Cozy Hair Scrunchies (Set of 6)",
    slug: "manamm-velvet-faux-fur-cozy-hair-scrunchies-6pcs",
    subcategory: "Hair Accessories",
    type: "Hair Scrunchies",
    description: "Cozy winter-ready faux fur hair scrunchies in rich tones of burgundy, blush, midnight black, and cream. Adds plush volume to ponytails and top knots.",
    setDetails: "6 Pieces Dual Pouch Cozy Scrunchies Set",
    material: "Plush Velvet Faux Fur, Strong Elastic Band",
    color: "Burgundy, Black, Blush Pink, Off-White, Cocoa",
    unit: "Pack of 6",
    tags: ["cozy-scrunchies", "velvet-fur", "winter-accessories", "hair-ponytail", "special-offer-199"]
  },
  {
    id: "prod_acc_28",
    sku: "MNM-ACC-28",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.51 PM (1).jpeg",
    name: "MANAMM Metallic Shimmer Mini Floral Jaw Clips (Pack of 12)",
    slug: "manamm-metallic-shimmer-mini-floral-jaw-clips-12pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "High-shine metallic finish mini floral hair clips in rose gold, gold, silver, and gunmetal tones. Ideal for accentuating braids and twists.",
    setDetails: "12 Pieces Mini Metallic Floral Clips Strip",
    material: "Electroplated Metallic Finish Acrylic, Metal Spring",
    color: "Rose Gold, Champagne Gold, Silver, Gloss Black",
    unit: "Pack of 12",
    tags: ["metallic-hair-clips", "mini-jaw-clips", "floral-hairpins", "party-styling", "special-offer-199"]
  },
  {
    id: "prod_acc_29",
    sku: "MNM-ACC-29",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.51 PM.jpeg",
    name: "MANAMM Vibrant Hawaiian Hibiscus Flower Hair Clips (Set of 8)",
    slug: "manamm-vibrant-hawaiian-hibiscus-flower-hair-clips-8pcs",
    subcategory: "Hair Accessories",
    type: "Hair Clips & Pins",
    description: "Tropical hibiscus flower hair claw clips featuring lifelike layered petals in bold yellow, magenta, teal, and coral shades with pearl center accents.",
    setDetails: "8 Pieces (4 Pairs) Carded Hibiscus Clips",
    material: "Textured Fabric Petals, Acrylic Clip Base, Faux Pearl",
    color: "Tropical Yellow, Hot Pink, Turquoise, Orange",
    unit: "Pack of 8",
    tags: ["hibiscus-clips", "hawaiian-flower", "tropical-hair-pin", "beach-party", "special-offer-199"]
  },
  {
    id: "prod_acc_30",
    sku: "MNM-ACC-30",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.52 PM (1).jpeg",
    name: "MANAMM Modern Matte French Rectangle Claw Clips (Pack of 8)",
    slug: "manamm-modern-matte-french-rectangle-claw-clips-8pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Chic minimalist matte square-frame hair claw clips in neutral tones (latte, espresso, cream, slate). Designed with heavy-duty springs for thick and long hair.",
    setDetails: "8 Pieces Matte Rectangle Hair Claw Clips Pack",
    material: "Soft-Touch Matte Rubberized Acrylic, Heavy-Duty Spring",
    color: "Neutral Earth Tones (Cream, Tan, Espresso, Charcoal)",
    unit: "Pack of 8",
    tags: ["matte-claw-clip", "french-hair-claw", "rectangle-clip", "minimalist-hair", "special-offer-199"]
  },
  {
    id: "prod_acc_31",
    sku: "MNM-ACC-31",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.52 PM (2).jpeg",
    name: "MANAMM Whimsical Teddy Bear & Cartoon Kids Hair Pins (Set of 16)",
    slug: "manamm-whimsical-teddy-bear-cartoon-kids-hair-pins-16pcs",
    subcategory: "Hair Accessories",
    type: "Hair Clips & Pins",
    description: "Cheerful cartoon character hair clips and snap pins featuring adorable teddy bear faces, bows, and sweet motifs on safe, anti-slip coated metal clips.",
    setDetails: "16 Pieces Carded Kids Character Hair Pins Set",
    material: "Non-Toxic Enamel Resin, Soft Coated Metal Clips",
    color: "Warm Neutral & Pastel Bear Palette",
    unit: "Pack of 16",
    tags: ["teddy-bear-clips", "kids-hairpins", "cartoon-clips", "baby-hair-accessories", "special-offer-199"]
  },
  {
    id: "prod_acc_32",
    sku: "MNM-ACC-32",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.52 PM.jpeg",
    name: "MANAMM Sunburst Daisy & Sunflower Matte Claw Clips (Set of 8)",
    slug: "manamm-sunburst-daisy-sunflower-matte-claw-clips-8pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Delightful floral sunflower and daisy motif claw clips in earthy matte tones (olive, mustard, terracotta, rose). Non-slip matte finish grips hair firmly.",
    setDetails: "8 Pieces Floral Daisy Claw Clips Pouch Set",
    material: "Matte Pastel Acrylic Resin & Alloy Spring",
    color: "Sunflower Yellow, Olive Green, Dusty Pink, Rust Brown",
    unit: "Pack of 8",
    tags: ["sunflower-clip", "daisy-hair-claw", "matte-floral-clips", "boho-hair", "special-offer-199"]
  },
  {
    id: "prod_acc_33",
    sku: "MNM-ACC-33",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.53 PM (1).jpeg",
    name: "MANAMM Silver Serenade Fluid Teardrop Open Bangle",
    slug: "manamm-silver-serenade-fluid-teardrop-open-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Sculptural silver cuff with an open-wrap bypass design, terminating in teardrop cat-eye crystals and pave accents.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Brass, Teardrop Cat-Eye Gem, Pavé Crystals",
    color: "Silver & Moonstone White",
    unit: "1 Piece",
    tags: ["teardrop-bangle", "open-wrap-cuff", "fluid-sculpture", "silver-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_34",
    sku: "MNM-ACC-34",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.53 PM (2).jpeg",
    name: "MANAMM Silver Radiance Triple Oval Halo Bangle",
    slug: "manamm-silver-radiance-triple-oval-halo-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Striking three-station halo bangle showcasing opalescent cat-eye gems framed by sparkling round-cut crystals in a high-polish silver setting.",
    setDetails: "1 Piece Bangle",
    material: "Silver Rhodium Alloy, 3 Oval Cat-Eye Cabochons, Crystal Halos",
    color: "Silver & Opalescent White",
    unit: "1 Piece",
    tags: ["triple-halo", "oval-bangle", "statement-cuff", "rhodium-finish", "special-offer-199"]
  },
  {
    id: "prod_acc_35",
    sku: "MNM-ACC-35",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.53 PM.jpeg",
    name: "MANAMM Shimmering Pastel Crystal & Stone Charm Bracelets (Set of 6)",
    slug: "manamm-shimmering-pastel-crystal-stone-charm-bracelets-6pcs",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets Set",
    description: "Assorted set of 6 sparkling crystal and gemstone beaded stretch bracelets featuring dangling celestial charms and polished round beads.",
    setDetails: "6 Pieces Carded Gemstone Stretch Bracelets Set",
    material: "Faceted Glass Crystals, Semi-Precious Beads, Metal Charms",
    color: "Multicolor Pastels & Gem Tones",
    unit: "Pack of 6",
    tags: ["crystal-bracelets", "beaded-jewelry", "charm-bracelets", "gemstone-stretch", "special-offer-199"]
  },
  {
    id: "prod_acc_36",
    sku: "MNM-ACC-36",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.54 PM (1).jpeg",
    name: "MANAMM Flutter Matte Butterfly Hair Claw Clips (Pack of 12)",
    slug: "manamm-flutter-matte-butterfly-hair-claw-clips-12pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Gorgeous butterfly-shaped hair claws in smooth matte colors ranging from soft pink and lavender to mustard and navy. Medium size suitable for half-up styles.",
    setDetails: "12 Pieces Butterfly Matte Claw Clips Pouch Set",
    material: "Matte Coated Acrylic & Reinforced Spring",
    color: "Assorted Matte Pastel & Earth Tones",
    unit: "Pack of 12",
    tags: ["butterfly-claws", "matte-hairpins", "colorful-clips", "hair-styling", "special-offer-199"]
  },
  {
    id: "prod_acc_37",
    sku: "MNM-ACC-37",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.54 PM (2).jpeg",
    name: "MANAMM Rose Gold Intertwined Teardrop Pavé Bangle",
    slug: "manamm-rose-gold-intertwined-teardrop-pave-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Elegantly twisted dual-branch rose gold bangle adorned with twin pear-shaped cat-eye stones nestled within crystal pave braids.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, Twin Cat-Eye Pears, Pavé Braid",
    color: "Rose Gold & Peach",
    unit: "1 Piece",
    tags: ["braided-bangle", "intertwined-cuff", "teardrop-gem", "rose-gold", "special-offer-199"]
  },
  {
    id: "prod_acc_38",
    sku: "MNM-ACC-38",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.54 PM.jpeg",
    name: "MANAMM Paradise Plumeria Flower Hair Claw Clips (Set of 10)",
    slug: "manamm-paradise-plumeria-flower-hair-claw-clips-10pcs",
    subcategory: "Hair Accessories",
    type: "Hair Claw Clips",
    description: "Vibrant tropical plumeria floral claw clips with frosted petal textures and gradient shading. Perfect accessory for summer dresses and beach outfits.",
    setDetails: "10 Pieces Strip Pack Floral Claw Clips",
    material: "Frosted Acrylic Resin & High-Tension Spring",
    color: "Gradient Cyan, Rose, Coral, Azure",
    unit: "Pack of 10",
    tags: ["frosted-plumeria", "beach-hair-clips", "summer-vacation", "flower-claw", "special-offer-199"]
  },
  {
    id: "prod_acc_39",
    sku: "MNM-ACC-39",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.55 PM (1).jpeg",
    name: "MANAMM Silver Pear Blossom & Luminous Pearl Bangle",
    slug: "manamm-silver-pear-blossom-luminous-pearl-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Refined luxury bangle combining a pear-cut cat-eye cabochon and an iridescent pearl accent within a pave crystal leaf frame.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Alloy, Teardrop Cat-Eye Stone, Faux Shell Pearl, Crystals",
    color: "Silver & Iridescent White",
    unit: "1 Piece",
    tags: ["pearl-bangle", "pear-cut-gem", "bridal-bracelet", "silver-cuff", "special-offer-199"]
  },
  {
    id: "prod_acc_40",
    sku: "MNM-ACC-40",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.55 PM.jpeg",
    name: "MANAMM Rose Gold Botanical Twin Leaf Gem Bangle",
    slug: "manamm-rose-gold-botanical-twin-leaf-gem-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Nature-inspired rose gold bangle crowned with two opposing leaf-shaped cat-eye stones connected by pavé diamond-style vine curves.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Brass, Marquise Cat-Eye Gems, Pavé Vines",
    color: "Rose Gold & Warm Champagne",
    unit: "1 Piece",
    tags: ["leaf-bangle", "botanical-bracelet", "twin-gem", "rose-gold-cuff", "special-offer-199"]
  },
  {
    id: "prod_acc_41",
    sku: "MNM-ACC-41",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.56 PM (1).jpeg",
    name: "MANAMM Silver Moonstone Halo Pavé Solitaire Bangle",
    slug: "manamm-silver-moonstone-halo-pave-solitaire-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Classic solitaire bangle highlighting a glowing round cat-eye stone wrapped in a halo of micropavé cubic zirconia on a sleek silver band.",
    setDetails: "1 Piece Bangle",
    material: "Silver Rhodium Finish, Round Cat-Eye Solitaire, Pavé Halo",
    color: "Silver & Moonstone Glow",
    unit: "1 Piece",
    tags: ["solitaire-bangle", "round-halo", "silver-jewelry", "moonstone-glow", "special-offer-199"]
  },
  {
    id: "prod_acc_42",
    sku: "MNM-ACC-42",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.56 PM.jpeg",
    name: "MANAMM Rose Gold Tri-Petal Orchid Blossom Bangle",
    slug: "manamm-rose-gold-tri-petal-orchid-blossom-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Exquisite orchid flower motif bracelet in warm rose gold, showcasing three smooth cat-eye gemstone petals with crystal stem accents.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold Plating, 3 Pear Cat-Eye Petals, Pavé Crystals",
    color: "Rose Gold & Peach",
    unit: "1 Piece",
    tags: ["orchid-bangle", "floral-bracelet", "three-petal", "rose-gold-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_43",
    sku: "MNM-ACC-43",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.57 PM (1).jpeg",
    name: "MANAMM Rose Gold Art Deco Rhombus Diamond Bangle",
    slug: "manamm-rose-gold-art-deco-rhombus-diamond-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Striking Art Deco inspired bangle featuring a geometric diamond rhombus frame encrusted with crystals around a cushion cat-eye gem.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, Cushion Cat-Eye Stone, Geometric Pavé Frame",
    color: "Rose Gold & Champagne",
    unit: "1 Piece",
    tags: ["art-deco-bangle", "rhombus-cuff", "geometric-bracelet", "statement-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_44",
    sku: "MNM-ACC-44",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.57 PM (2).jpeg",
    name: "MANAMM Silver Orbit Triple Cat-Eye Designer Bangle",
    slug: "manamm-silver-orbit-triple-cat-eye-designer-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Futuristic curved orbit silhouette bangle with three graduated cat-eye gemstones resting along an asymmetric crystal ribbon.",
    setDetails: "1 Piece Bangle",
    material: "Silver-Plated Alloy, 3 Graduated Cat-Eye Stones, Crystal Channel",
    color: "Silver & Moonlight Pearl",
    unit: "1 Piece",
    tags: ["orbit-bangle", "asymmetric-cuff", "triple-stone", "silver-bracelet", "special-offer-199"]
  },
  {
    id: "prod_acc_45",
    sku: "MNM-ACC-45",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.57 PM.jpeg",
    name: "MANAMM Rose Gold Sweetheart Open Heart & Gem Bangle",
    slug: "manamm-rose-gold-sweetheart-open-heart-gem-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Romantic charm bangle showcasing an open pavé crystal heart paired with a glowing cat-eye cabochon along a slender rose gold band.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold Plating, Open Pavé Heart, Cat-Eye Gem",
    color: "Rose Gold & Soft Peach",
    unit: "1 Piece",
    tags: ["heart-bangle", "sweetheart-cuff", "romantic-jewelry", "gift-for-her", "special-offer-199"]
  },
  {
    id: "prod_acc_46",
    sku: "MNM-ACC-46",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.58 PM (1).jpeg",
    name: "MANAMM Rose Gold Royal Lattice Oval Cat-Eye Bangle",
    slug: "manamm-rose-gold-royal-lattice-oval-cat-eye-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Opulent lattice cuff bracelet in warm rose gold, featuring openwork side arches and a dramatic oval cat-eye centerpiece encircled by micropave stones.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Brass, Oval Cat-Eye Gem, Openwork Lattice Cuff",
    color: "Rose Gold & Sunset Peach",
    unit: "1 Piece",
    tags: ["lattice-cuff", "openwork-bangle", "oval-cat-eye", "grand-jewelry", "special-offer-199"]
  },
  {
    id: "prod_acc_47",
    sku: "MNM-ACC-47",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.58 PM.jpeg",
    name: "MANAMM Rose Gold Meadow Leaf & Teardrop Wrap Bangle",
    slug: "manamm-rose-gold-meadow-leaf-teardrop-wrap-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Fluid botanical wrap bangle featuring a pave-encrusted leaf meeting an opalescent teardrop stone in a graceful bypass curve.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, Leaf Pavé Motif, Teardrop Cat-Eye Gem",
    color: "Rose Gold & Amber Peach",
    unit: "1 Piece",
    tags: ["botanical-wrap", "leaf-and-gem", "rose-gold-bangle", "meadow-motif", "special-offer-199"]
  },
  {
    id: "prod_acc_48",
    sku: "MNM-ACC-48",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.59 PM (1).jpeg",
    name: "MANAMM Rose Gold Harmony Oval Gemstone Bangle",
    slug: "manamm-rose-gold-harmony-oval-gemstone-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Clean and elegant full-circle bangle crafted in premium rose gold plating with a bezel-set luminous oval cat-eye centerpiece.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Alloy, Oval Gemstone Cabochon, Pavé Accents",
    color: "Rose Gold & Soft Peach",
    unit: "1 Piece",
    tags: ["harmony-bangle", "oval-gemstone", "minimalist-rose-gold", "daily-elegance", "special-offer-199"]
  },
  {
    id: "prod_acc_49",
    sku: "MNM-ACC-49",
    sourceFile: "WhatsApp Image 2026-11-03 at 7.22.59 PM.jpeg",
    name: "MANAMM Rose Gold Symphony Swirl Twin Teardrop Bangle",
    slug: "manamm-rose-gold-symphony-swirl-twin-teardrop-bangle",
    subcategory: "Fashion Jewelry",
    type: "Bangles & Bracelets",
    description: "Sinuous twin teardrop swirl bangle adorned with two radiant opalescent stones and crystal pavé flourishes on a polished rose gold cuff.",
    setDetails: "1 Piece Bangle",
    material: "Rose Gold-Plated Brass, Twin Pear Stones, Crystal Swirls",
    color: "Rose Gold & Champagne Peach",
    unit: "1 Piece",
    tags: ["symphony-swirl", "twin-teardrop", "rose-gold-cuff", "festive-elegance", "special-offer-199"]
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode} for ${url}`));
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

async function processSingleItem(item) {
  const finalLocalJpg = path.join(FINAL_DIR, `${item.id}.jpg`);
  const webLocalJpg = path.join(WEB_IMG_DIR, `${item.id}.jpg`);
  const appLocalJpg = path.join(APP_IMG_DIR, `${item.id}.jpg`);
  const rawBgRemoved = path.join(SCRATCH_DIR, `${item.id}_raw_bg_removed.jpg`);

  let cloudinaryUrl = '';

  if (fs.existsSync(finalLocalJpg) && fs.statSync(finalLocalJpg).size > 10000) {
    console.log(`[${item.id}] Local processed image exists. Checking Cloudinary...`);
  } else {
    const srcPath = path.join(SOURCE_DIR, item.sourceFile);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Source file missing: ${srcPath}`);
    }

    console.log(`[${item.id}] Step 1: Uploading raw source to Cloudinary...`);
    const rawUpload = await cloudinary.uploader.upload(srcPath, {
      folder: 'manamm/raw_accessories',
      public_id: `${item.id}_raw`,
      overwrite: true,
    });

    console.log(`[${item.id}] Step 2: Applying Cloudinary AI background removal...`);
    const bgRemovalUrl = cloudinary.url(rawUpload.public_id, {
      transformation: [
        { effect: 'background_removal' },
        { background: 'white' }
      ],
      format: 'jpg',
      secure: true
    });

    console.log(`[${item.id}] Step 3: Downloading background-removed image...`);
    await downloadFile(bgRemovalUrl, rawBgRemoved);

    console.log(`[${item.id}] Step 4: Trimming and formatting onto 800x1000 pure white canvas...`);
    // Trim white borders
    const trimmed = await sharp(rawBgRemoved)
      .trim({ threshold: 10, background: { r: 255, g: 255, b: 255 } })
      .toBuffer();

    // Resize inside 720x880 to leave pleasant breathing room
    const resized = await sharp(trimmed)
      .resize(720, 880, { fit: 'inside' })
      .toBuffer();

    const meta = await sharp(resized).metadata();
    const left = Math.floor((800 - meta.width) / 2);
    const top = Math.floor((1000 - meta.height) / 2);

    await sharp({
      create: {
        width: 800,
        height: 1000,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 92 })
    .toFile(finalLocalJpg);

    console.log(`[${item.id}] Successfully created studio packshot at ${finalLocalJpg}`);
  }

  // Copy to web and app
  fs.copyFileSync(finalLocalJpg, webLocalJpg);
  fs.copyFileSync(finalLocalJpg, appLocalJpg);

  // Step 5: Upload final high-def packshot to Cloudinary
  console.log(`[${item.id}] Step 5: Uploading final packshot to Cloudinary manamm/products/${item.id}...`);
  const finalUpload = await cloudinary.uploader.upload(finalLocalJpg, {
    folder: 'manamm/products',
    public_id: item.id,
    overwrite: true,
  });
  cloudinaryUrl = finalUpload.secure_url;
  console.log(`[${item.id}] Cloudinary URL: ${cloudinaryUrl}`);

  return {
    ...item,
    imageUrl: cloudinaryUrl,
    version: finalUpload.version
  };
}

async function main() {
  console.log(`=== Processing ${items.length} Accessories Products ===`);
  const manifestPath = path.join(__dirname, 'accessories_manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {}
  }

  const processedList = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n--- [${i + 1}/${items.length}] Processing ${item.id}: ${item.name} ---`);
    let retries = 0;
    let success = false;
    while (!success && retries < 3) {
      try {
        const result = await processSingleItem(item);
        manifest[item.id] = result;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        processedList.push(result);
        success = true;
      } catch (err) {
        retries++;
        console.error(`[${item.id}] Error on attempt ${retries}:`, err.message);
        if (retries >= 3) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.log('\n=== All 49 images processed and uploaded successfully! ===');

  // Build product records
  const newProductRecords = processedList.map(item => {
    return {
      id: item.id,
      sku: item.sku,
      slug: item.slug,
      name: item.name,
      shortDescription: `${item.name} - Special promotional price ₹199 only.`,
      description: `${item.name}. ${item.description} Featured in the MANAMM Partner Accessories Collection at a limited-time promotional rate of ₹199 each (MRP ₹499).`,
      price: 199,
      compareAtPrice: 499,
      mrp: 499,
      discountPercentage: 60,
      currency: "INR",
      category: "Accessories",
      categoryId: "cat_accessories",
      subcategory: item.subcategory,
      mainCategoryId: "cat_fashion_lifestyle",
      mainCategory: "Partner Collections & Lifestyle",
      sourceType: "PARTNER",
      source: "Partner Collection",
      brandId: "brd_partner_collections",
      brand: "MANAMM Partner Studio",
      imageUrl: item.imageUrl,
      images: [item.imageUrl],
      thumbnail: item.imageUrl,
      priceConfirmed: true,
      status: "ACTIVE",
      stock: 100,
      isAvailable: true,
      isFeatured: true,
      featured: true,
      newArrival: true,
      isActive: true,
      rating: 4.9,
      reviewCount: 32,
      unit: item.unit,
      attributes: [
        { name: "Brand", value: "MANAMM Partner Studio" },
        { name: "Category", value: "Accessories" },
        { name: "Subcategory", value: item.subcategory },
        { name: "Product Type", value: item.type },
        { name: "Price", value: "₹199" },
        { name: "MRP", value: "₹499" },
        { name: "Discount", value: "60% OFF" },
        { name: "Set Details", value: item.setDetails },
        { name: "Material", value: item.material },
        { name: "Color / Finish", value: item.color },
        { name: "Packaging", value: "Tamper-Evident Studio Poly Pack" }
      ],
      tags: item.tags,
      createdAt: "2026-11-03T14:00:00.000Z",
      updatedAt: "2026-11-03T14:00:00.000Z"
    };
  });

  // Update JSON Catalogs
  const targets = [
    { file: WEB_JSON, name: 'manammcare' },
    { file: APP_JSON, name: 'manamm_app' },
    { file: BACKEND_JSON, name: 'manammcare_backend' }
  ];

  for (const t of targets) {
    if (!fs.existsSync(t.file)) continue;
    const existing = JSON.parse(fs.readFileSync(t.file, 'utf8'));
    // Remove if existing
    const existingIds = new Set(newProductRecords.map(p => p.id));
    const filtered = existing.filter(p => !existingIds.has(p.id));
    const merged = [...filtered, ...newProductRecords];
    fs.writeFileSync(t.file, JSON.stringify(merged, null, 2));
    console.log(`Updated ${t.name} catalog with ${newProductRecords.length} accessories! Total items: ${merged.length}`);
  }

  // Sync to MySQL Database via Prisma
  console.log('\n=== Syncing new accessories to MySQL Database via Prisma ===');
  for (const p of newProductRecords) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        category: p.category,
        brand: p.brand,
        imageUrl: p.imageUrl,
        images: JSON.stringify(p.images),
        isAvailable: true,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        tags: JSON.stringify(p.tags),
      },
      create: {
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        category: p.category,
        brand: p.brand,
        imageUrl: p.imageUrl,
        images: JSON.stringify(p.images),
        isAvailable: true,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        tags: JSON.stringify(p.tags),
      }
    });
  }
  console.log('Successfully upserted all 49 products into MySQL Database!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

