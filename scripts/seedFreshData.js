import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';

// Future expansion notes:
// - Add new shop coverage in STORE_PROFILE_META and BASE_STORE_PROFILES.
// - Add new canonical purchasable items in INGREDIENT_CATALOG using p(...).
// - Add new customer prompts in RECIPE_USE_CASES and keep IDs aligned with INGREDIENT_CATALOG.
// - Keep product matching deterministic: aliases, ingredientTags, substituteGroupIds, and searchTokens
//   are intentionally seeded so the AI feature can avoid vector search/RAG on Vercel free tier.
// - Run `npm run seed:dry-run` after every catalog change; validateSeedData catches broken use-case refs.
// - Prefer stable category images plus selected product overrides over mass hotlinking exact SKU images.

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const NOW = new Date().toISOString();
const BATCH_LIMIT = 400;

const args = parseArgs(process.argv.slice(2));
loadEnvFile(path.join(ROOT, '.env.local'));

const PROFILES = {
  compact: { neighborhoods: 24, includePharmacyEvery: 4 },
  balanced: { neighborhoods: 42, includePharmacyEvery: 4 },
  dense: { neighborhoods: 48, includePharmacyEvery: 3 },
};

async function main() {
  const profile = PROFILES[args.profile] || PROFILES.balanced;
  const selectedNeighborhoods = KOLKATA_NEIGHBORHOODS.slice(0, Number(args.neighborhoods || profile.neighborhoods));
  const seed = buildSeedData(selectedNeighborhoods, profile);

  validateSeedData(seed);
  printPlan(seed, selectedNeighborhoods);

  if (!args.write || args.dryRun) {
    console.log('\nDry run only. No Firestore data was changed.');
    console.log('Run `npm run seed:fresh` to delete old seeded collections and write this dataset.');
    return;
  }

  const db = initializeAdmin();

  if (args.fresh) {
    if (!args.confirmDelete) {
      throw new Error('Refusing destructive seed. Pass --confirm-delete with --fresh.');
    }
    await deleteExistingSeedData(db);
  }

  await writeSeedData(db, seed, Number(args.batchDelayMs || 100));
  console.log('\nSeed complete.');
}

function buildSeedData(neighborhoods, options) {
  const ingredientDocs = INGREDIENT_CATALOG.map((item) => ({
    id: item.id,
    data: {
      id: item.id,
      canonicalName: item.canonicalName,
      aliases: item.aliases,
      category: item.category,
      subcategory: item.subcategory,
      ingredientTags: item.tags,
      substituteGroupIds: item.substituteGroupIds,
      unitType: item.unitType,
      packSize: item.packSize,
      searchTokens: buildSearchTokens(item),
      createdAt: NOW,
      lastUpdated: NOW,
      seedVersion: 'ai-recipe-v1',
    },
  }));

  const shopDocs = [];
  const productDocs = [];
  const recipeUseCaseDocs = RECIPE_USE_CASES.map((useCase) => ({
    id: useCase.id,
    data: {
      ...useCase,
      searchTokens: tokenize([useCase.title, ...(useCase.aliases || []), ...(useCase.requiredIngredientIds || [])].join(' ')),
      createdAt: NOW,
      lastUpdated: NOW,
      seedVersion: 'ai-recipe-v1',
    },
  }));

  neighborhoods.forEach((area, areaIndex) => {
    const profiles = [...BASE_STORE_PROFILES];
    if (areaIndex % options.includePharmacyEvery === 0) profiles.push('pharmacy_personal');

    profiles.forEach((storeProfile, profileIndex) => {
      const shop = buildShop(area, areaIndex, storeProfile, profileIndex);
      shopDocs.push({ id: shop.id, data: shop });

      const products = buildProductsForShop(shop, storeProfile, areaIndex);
      products.forEach((product) => {
        productDocs.push({ id: product.id, data: product });
      });
    });
  });

  const limitedProducts = args.limitProducts
    ? productDocs.slice(0, Number(args.limitProducts))
    : productDocs;

  return {
    shops: shopDocs,
    products: limitedProducts,
    ingredients: ingredientDocs,
    recipeUseCases: recipeUseCaseDocs,
  };
}

function buildShop(area, areaIndex, storeProfile, profileIndex) {
  const meta = STORE_PROFILE_META[storeProfile];
  const jitter = coordinateJitter(areaIndex, profileIndex);
  const id = slug(`${area.name}-${storeProfile}-${profileIndex + 1}`);
  const rating = round(4.05 + ((areaIndex + profileIndex) % 9) * 0.08, 1);
  const openHour = storeProfile === 'meat_fish' ? '07:00' : storeProfile === 'party_household' ? '09:00' : '08:00';
  const closeHour = storeProfile === 'party_household' ? '23:30' : storeProfile === 'pharmacy_personal' ? '22:30' : '22:00';

  return {
    id,
    ownerId: `seed-owner-${id}`,
    name: buildShopName(area.name, storeProfile, areaIndex, profileIndex),
    category: meta.category,
    storeType: storeProfile,
    specialties: meta.specialties,
    status: 'open',
    verified: true,
    deliveryAvailable: true,
    deliveryRadiusKm: 5.5,
    latitude: round(area.lat + jitter.lat, 6),
    longitude: round(area.lng + jitter.lng, 6),
    geoCell: `${Math.round((area.lat + jitter.lat) * 100)}_${Math.round((area.lng + jitter.lng) * 100)}`,
    locationName: area.name,
    address: `${12 + profileIndex}, ${area.name} Market Road, Kolkata`,
    phone: buildPhone(areaIndex, profileIndex),
    rating,
    openingTime: openHour,
    closingTime: closeHour,
    imageUrl: placeholderImage(meta.category),
    searchTokens: tokenize(`${area.name} ${meta.category} ${meta.specialties.join(' ')}`),
    createdAt: NOW,
    lastUpdated: NOW,
    seedVersion: 'ai-recipe-v1',
  };
}

function buildProductsForShop(shop, storeProfile, areaIndex) {
  const categories = STORE_PROFILE_META[storeProfile].categories;
  const maxPerCategory = STORE_PROFILE_META[storeProfile].maxPerCategory;
  const docs = [];

  categories.forEach((category) => {
    const candidates = INGREDIENT_CATALOG.filter((item) => item.category === category);
    const limit = maxPerCategory[category] || candidates.length;
    candidates.slice(0, limit).forEach((item, itemIndex) => {
      if (shouldSkipOptionalItem(storeProfile, areaIndex, itemIndex, item)) return;
      docs.push(buildProductDoc(shop, item, itemIndex, areaIndex));
    });
  });

  return docs;
}

function buildProductDoc(shop, item, itemIndex, areaIndex) {
  const brand = pickBrand(item.category, areaIndex + itemIndex);
  const price = priceWithVariation(item.basePrice, areaIndex, itemIndex);
  const stock = stockFor(item.category, areaIndex, itemIndex);
  const productName = brand
    ? `${brand} ${item.displayName || titleCase(item.canonicalName)} ${formatPack(item.packSize)}`
    : `${titleCase(item.canonicalName)} ${formatPack(item.packSize)}`;

  const searchTokens = buildSearchTokens(item, productName, shop.name, shop.locationName);
  const id = slug(`${shop.id}-${item.id}-${formatPack(item.packSize)}`);

  return {
    id,
    shopId: shop.id,
    shopName: shop.name,
    shopLocationName: shop.locationName,
    shopLatitude: shop.latitude,
    shopLongitude: shop.longitude,
    name: productName,
    canonicalName: item.canonicalName,
    normalizedName: normalizeText(productName),
    aliases: item.aliases,
    ingredientIds: [item.id],
    category: item.category,
    subcategory: item.subcategory,
    ingredientTags: item.tags,
    substituteGroupIds: item.substituteGroupIds,
    useCaseTags: item.useCaseTags,
    unitType: item.unitType,
    packSize: item.packSize,
    brand,
    price,
    originalPrice: Math.round(price * 1.08),
    stock,
    inStock: stock > 0,
    image: productImage(item),
    imageUrl: productImage(item),
    rating: round(4 + ((areaIndex + itemIndex) % 10) * 0.08, 1),
    searchText: searchTokens.join(' '),
    searchTokens,
    createdAt: NOW,
    lastUpdated: NOW,
    seedVersion: 'ai-recipe-v1',
  };
}

async function deleteExistingSeedData(db) {
  console.log('\nDeleting existing seeded data...');
  await deleteCollectionGroup(db, 'catalog');
  await deleteCollection(db.collection('products'));
  await deleteCollection(db.collection('shops'));
  await deleteCollection(db.collection('ingredients'));
  await deleteCollection(db.collection('recipeUseCases'));
}

async function writeSeedData(db, seedData, batchDelayMs) {
  console.log('\nWriting seed data...');
  const writes = [
    ...seedData.ingredients.map((doc) => ['ingredients', doc]),
    ...seedData.recipeUseCases.map((doc) => ['recipeUseCases', doc]),
    ...seedData.shops.map((doc) => ['shops', doc]),
    ...seedData.products.map((doc) => ['products', doc]),
  ];

  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = writes.slice(i, i + BATCH_LIMIT);
    chunk.forEach(([collectionName, docDef]) => {
      batch.set(db.collection(collectionName).doc(docDef.id), docDef.data, { merge: false });
    });
    await batch.commit();
    console.log(`Committed ${Math.min(i + chunk.length, writes.length)} / ${writes.length} writes`);
    if (batchDelayMs > 0) await sleep(batchDelayMs);
  }
}

async function deleteCollection(collectionRef) {
  let total = 0;
  while (true) {
    const snapshot = await collectionRef.limit(BATCH_LIMIT).get();
    if (snapshot.empty) break;
    const batch = collectionRef.firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snapshot.size;
    console.log(`Deleted ${total} from ${collectionRef.path}`);
    await sleep(100);
  }
}

async function deleteCollectionGroup(db, groupName) {
  let total = 0;
  while (true) {
    const snapshot = await db.collectionGroup(groupName).limit(BATCH_LIMIT).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snapshot.size;
    console.log(`Deleted ${total} from collectionGroup(${groupName})`);
    await sleep(100);
  }
}

function initializeAdmin() {
  const serviceAccountPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }
  return admin.firestore();
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

function printPlan(seedData, selectedNeighborhoods) {
  const categoryCounts = countBy(seedData.products, (doc) => doc.data.category);
  const profileCounts = countBy(seedData.shops, (doc) => doc.data.storeType);
  const totalWrites = seedData.shops.length + seedData.products.length + seedData.ingredients.length + seedData.recipeUseCases.length;

  console.log('Fresh Kolkata seed plan');
  console.log(`Profile: ${args.profile || 'balanced'}`);
  console.log(`Neighborhoods: ${selectedNeighborhoods.length}`);
  console.log(`Shops: ${seedData.shops.length}`);
  console.log(`Products: ${seedData.products.length}`);
  console.log(`Ingredients: ${seedData.ingredients.length}`);
  console.log(`Recipe/use-case docs: ${seedData.recipeUseCases.length}`);
  console.log(`Total writes before optional deletes: ${totalWrites}`);
  console.log('\nStore profile counts:');
  Object.entries(profileCounts).forEach(([key, value]) => console.log(`- ${key}: ${value}`));
  console.log('\nProduct category counts:');
  Object.entries(categoryCounts).forEach(([key, value]) => console.log(`- ${key}: ${value}`));
}

function validateSeedData(seedData) {
  const ingredientIds = new Set(seedData.ingredients.map((doc) => doc.id));
  const missing = [];
  seedData.recipeUseCases.forEach((doc) => {
    (doc.data.requiredIngredientIds || []).forEach((id) => {
      if (!ingredientIds.has(id)) missing.push(`${doc.id}:${id}`);
    });
  });
  if (missing.length > 0) {
    throw new Error(`Recipe use cases reference missing ingredients: ${missing.join(', ')}`);
  }
}

function parseArgs(argv) {
  const out = {
    profile: 'balanced',
    dryRun: false,
    write: false,
    fresh: false,
    confirmDelete: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--write') out.write = true;
    else if (arg === '--fresh') out.fresh = true;
    else if (arg === '--confirm-delete') out.confirmDelete = true;
    else if (arg.startsWith('--profile=')) out.profile = arg.split('=')[1];
    else if (arg === '--profile') out.profile = argv[++i];
    else if (arg.startsWith('--neighborhoods=')) out.neighborhoods = arg.split('=')[1];
    else if (arg === '--neighborhoods') out.neighborhoods = argv[++i];
    else if (arg.startsWith('--limit-products=')) out.limitProducts = arg.split('=')[1];
    else if (arg === '--limit-products') out.limitProducts = argv[++i];
    else if (arg.startsWith('--batch-delay-ms=')) out.batchDelayMs = arg.split('=')[1];
    else if (arg === '--batch-delay-ms') out.batchDelayMs = argv[++i];
  }
  return out;
}

function p(canonicalName, category, subcategory, unitType, packSize, basePrice, aliases = [], tags = [], substituteGroupIds = [], useCaseTags = []) {
  return {
    id: slug(canonicalName),
    canonicalName,
    displayName: titleCase(canonicalName),
    category,
    subcategory,
    unitType,
    packSize,
    basePrice,
    aliases,
    tags,
    substituteGroupIds,
    useCaseTags,
  };
}

function buildSearchTokens(item, ...extra) {
  return tokenize([
    item.canonicalName,
    item.category,
    item.subcategory,
    ...(item.aliases || []),
    ...(item.tags || []),
    ...(item.substituteGroupIds || []),
    ...(item.useCaseTags || []),
    ...extra,
  ].join(' '));
}

function tokenize(text) {
  return [...new Set(normalizeText(text).split(' ').filter((token) => token.length > 1))];
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(text) {
  return normalizeText(text).replace(/\s+/g, '-').slice(0, 140);
}

function titleCase(text) {
  return String(text).replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function formatPack(packSize) {
  if (!packSize) return '1 unit';
  return `${packSize.quantity}${packSize.unit}`;
}

function priceWithVariation(basePrice, areaIndex, itemIndex) {
  const factor = 0.94 + (((areaIndex * 7 + itemIndex * 11) % 15) / 100);
  return Math.max(5, Math.round(basePrice * factor));
}

function stockFor(category, areaIndex, itemIndex) {
  const base = {
    'Fresh Vegetables': 35,
    'Fresh Fruits': 30,
    Dairy: 24,
    'Meat & Fish': 18,
    Eggs: 25,
    Bakery: 20,
    Snacks: 45,
    Beverages: 50,
    'Party Supplies': 35,
  }[category] || 28;
  return base + ((areaIndex + itemIndex) % 22);
}

function coordinateJitter(areaIndex, profileIndex) {
  const latOffset = (((areaIndex * 13 + profileIndex * 5) % 17) - 8) * 0.0009;
  const lngOffset = (((areaIndex * 11 + profileIndex * 7) % 19) - 9) * 0.0009;
  return { lat: latOffset, lng: lngOffset };
}

function buildPhone(areaIndex, profileIndex) {
  return `9${String(100000000 + areaIndex * 1000 + profileIndex * 137).slice(0, 9)}`;
}

function buildShopName(areaName, storeProfile, areaIndex, profileIndex) {
  const prefixes = ['Annapurna', 'Maa Tara', 'New Bengal', 'Daily Fresh', 'Ranna Bazar', 'Subho', 'Metro', 'Bengal Basket'];
  const prefix = prefixes[(areaIndex + profileIndex) % prefixes.length];
  const suffix = STORE_PROFILE_META[storeProfile].nameSuffix;
  return `${prefix} ${areaName} ${suffix}`;
}

function pickBrand(category, index) {
  const brands = CATEGORY_BRANDS[category] || [''];
  return brands[index % brands.length];
}

function placeholderImage(label) {
  return CATEGORY_IMAGE_URLS[label] || `https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500`;
}

function productImage(item) {
  return PRODUCT_IMAGE_OVERRIDES[item.id] || CATEGORY_IMAGE_URLS[item.category] || CATEGORY_IMAGE_URLS[item.subcategory] || placeholderImage(item.category);
}

function shouldSkipOptionalItem(storeProfile, areaIndex, itemIndex, item) {
  if (storeProfile === 'super_kirana') return false;
  if (['Staples', 'Pulses', 'Spices', 'Oils & Ghee'].includes(item.category)) return false;
  return Boolean(item.optional && (areaIndex + itemIndex) % 3 === 0);
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function round(value, decimals) {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const KOLKATA_NEIGHBORHOODS = [
  { name: 'Salt Lake Sector I', lat: 22.5946, lng: 88.4120 },
  { name: 'Salt Lake Sector V', lat: 22.5797, lng: 88.4335 },
  { name: 'New Town Action Area I', lat: 22.5790, lng: 88.4682 },
  { name: 'New Town Action Area II', lat: 22.6039, lng: 88.4697 },
  { name: 'Rajarhat', lat: 22.6238, lng: 88.4504 },
  { name: 'Lake Town', lat: 22.6048, lng: 88.4026 },
  { name: 'Dum Dum', lat: 22.6420, lng: 88.4312 },
  { name: 'Nagerbazar', lat: 22.6174, lng: 88.4122 },
  { name: 'Shyambazar', lat: 22.6013, lng: 88.3726 },
  { name: 'Sovabazar', lat: 22.5968, lng: 88.3656 },
  { name: 'Sealdah', lat: 22.5685, lng: 88.3710 },
  { name: 'College Street', lat: 22.5764, lng: 88.3639 },
  { name: 'Esplanade', lat: 22.5646, lng: 88.3433 },
  { name: 'Park Street', lat: 22.5531, lng: 88.3529 },
  { name: 'Camac Street', lat: 22.5465, lng: 88.3536 },
  { name: 'Ballygunge', lat: 22.5286, lng: 88.3654 },
  { name: 'Gariahat', lat: 22.5195, lng: 88.3663 },
  { name: 'Kasba', lat: 22.5150, lng: 88.3933 },
  { name: 'Ruby', lat: 22.5136, lng: 88.4019 },
  { name: 'Topsia', lat: 22.5399, lng: 88.3867 },
  { name: 'Park Circus', lat: 22.5413, lng: 88.3682 },
  { name: 'Jadavpur', lat: 22.4986, lng: 88.3697 },
  { name: 'Santoshpur', lat: 22.4918, lng: 88.3848 },
  { name: 'Garia', lat: 22.4668, lng: 88.4016 },
  { name: 'Patuli', lat: 22.4745, lng: 88.3869 },
  { name: 'Tollygunge', lat: 22.4969, lng: 88.3453 },
  { name: 'New Alipore', lat: 22.5145, lng: 88.3220 },
  { name: 'Behala', lat: 22.4987, lng: 88.3100 },
  { name: 'Sakherbazar', lat: 22.4798, lng: 88.3027 },
  { name: 'Khidirpur', lat: 22.5382, lng: 88.3183 },
  { name: 'Alipore', lat: 22.5250, lng: 88.3310 },
  { name: 'Howrah Maidan', lat: 22.5892, lng: 88.3103 },
  { name: 'Shibpur', lat: 22.5667, lng: 88.3135 },
  { name: 'Belur', lat: 22.6327, lng: 88.3556 },
  { name: 'Bally', lat: 22.6500, lng: 88.3418 },
  { name: 'Kankurgachi', lat: 22.5809, lng: 88.3915 },
  { name: 'Phoolbagan', lat: 22.5744, lng: 88.3892 },
  { name: 'Ultadanga', lat: 22.5904, lng: 88.3984 },
  { name: 'Maniktala', lat: 22.5866, lng: 88.3806 },
  { name: 'Baguiati', lat: 22.6159, lng: 88.4275 },
  { name: 'Kestopur', lat: 22.5942, lng: 88.4290 },
  { name: 'Chingrighata', lat: 22.5575, lng: 88.4089 },
  { name: 'Bansdroni', lat: 22.4734, lng: 88.3587 },
  { name: 'Naktala', lat: 22.4766, lng: 88.3680 },
  { name: 'Baranagar', lat: 22.6414, lng: 88.3777 },
  { name: 'Sinthi', lat: 22.6262, lng: 88.3852 },
  { name: 'Budge Budge', lat: 22.4824, lng: 88.1818 },
  { name: 'Sonarpur', lat: 22.4381, lng: 88.4318 },
];

const BASE_STORE_PROFILES = ['super_kirana', 'fresh_produce', 'dairy_eggs', 'meat_fish', 'party_household', 'quick_kirana', 'snack_beverage'];

const STORE_PROFILE_META = {
  super_kirana: {
    category: 'Kirana',
    nameSuffix: 'Kirana Mart',
    specialties: ['daily grocery', 'spices', 'rice', 'dal', 'recipe ingredients'],
    categories: ['Staples', 'Flours', 'Pulses', 'Oils & Ghee', 'Spices', 'Dairy', 'Snacks', 'Beverages', 'Frozen & Ready'],
    maxPerCategory: {},
  },
  fresh_produce: {
    category: 'Vegetables',
    nameSuffix: 'Fresh Produce',
    specialties: ['vegetables', 'fruits', 'herbs', 'salad'],
    categories: ['Fresh Vegetables', 'Fresh Fruits', 'Fresh Herbs'],
    maxPerCategory: {},
  },
  dairy_eggs: {
    category: 'Dairy',
    nameSuffix: 'Dairy & Eggs',
    specialties: ['milk', 'curd', 'paneer', 'eggs', 'breakfast'],
    categories: ['Dairy', 'Eggs', 'Bakery'],
    maxPerCategory: {},
  },
  meat_fish: {
    category: 'Meat & Fish',
    nameSuffix: 'Meat & Fish',
    specialties: ['fish curry', 'chicken curry', 'mutton', 'eggs'],
    categories: ['Meat & Fish', 'Eggs', 'Spices'],
    maxPerCategory: { Spices: 18 },
  },
  party_household: {
    category: 'Snacks',
    nameSuffix: 'Party & Home Needs',
    specialties: ['party snacks', 'beverages', 'disposables', 'household'],
    categories: ['Snacks', 'Beverages', 'Sweets', 'Bakery', 'Party Supplies', 'Household', 'Personal Care'],
    maxPerCategory: {},
  },
  quick_kirana: {
    category: 'Kirana',
    nameSuffix: 'Quick Kirana',
    specialties: ['daily essentials', 'quick grocery', 'breakfast', 'tea snacks'],
    categories: ['Staples', 'Flours', 'Pulses', 'Oils & Ghee', 'Spices', 'Dairy', 'Snacks', 'Beverages', 'Household'],
    maxPerCategory: {
      Staples: 8,
      Flours: 4,
      Pulses: 5,
      'Oils & Ghee': 4,
      Spices: 14,
      Dairy: 5,
      Snacks: 8,
      Beverages: 8,
      Household: 4,
    },
  },
  snack_beverage: {
    category: 'Snacks',
    nameSuffix: 'Snacks & Beverages',
    specialties: ['party snacks', 'cold drinks', 'late night snacks', 'dessert'],
    categories: ['Snacks', 'Beverages', 'Sweets', 'Bakery', 'Party Supplies', 'Frozen & Ready'],
    maxPerCategory: {
      Snacks: 10,
      Beverages: 10,
      Sweets: 4,
      Bakery: 5,
      'Party Supplies': 4,
      'Frozen & Ready': 4,
    },
  },
  pharmacy_personal: {
    category: 'Medical Store',
    nameSuffix: 'Pharmacy & Essentials',
    specialties: ['medicine', 'personal care', 'baby care', 'first aid'],
    categories: ['Medical Store', 'Personal Care', 'Household'],
    maxPerCategory: {},
  },
};

const CATEGORY_BRANDS = {
  Staples: ['India Gate', 'Daawat', 'Fortune', 'Tata Sampann', 'Local Select'],
  Flours: ['Aashirvaad', 'Pillsbury', 'Fresh Chakki', 'Local Select'],
  Pulses: ['Tata Sampann', 'Nature Fresh', 'Local Select', 'Organic Tattva'],
  'Oils & Ghee': ['Fortune', 'Saffola', 'Dhara', 'Amul', 'Local Select'],
  Spices: ['Catch', 'Everest', 'MDH', 'Sunrise', 'Local Select'],
  Dairy: ['Amul', 'Mother Dairy', 'Metro Dairy', 'Local Dairy'],
  Eggs: ['Farm Fresh', 'Suguna', 'Local Farm'],
  'Fresh Vegetables': ['Fresh Pick', 'Local Farm', 'Morning Basket'],
  'Fresh Fruits': ['Fresh Pick', 'Local Orchard', 'Morning Basket'],
  'Fresh Herbs': ['Fresh Pick', 'Local Farm'],
  'Meat & Fish': ['Fresh Cut', 'Local Market', 'Bengal Fresh'],
  Bakery: ['Britannia', 'Modern', 'Local Bakery'],
  Snacks: ['Haldiram', 'Bikaji', 'Pringles', 'Kurkure', 'Local Namkeen'],
  Beverages: ['Coca Cola', 'PepsiCo', 'Tata', 'Real', 'Local Select'],
  Sweets: ['Balaram Mullick', 'Local Mishti', 'Haldiram'],
  'Party Supplies': ['PartyPro', 'Local Select'],
  Household: ['Surf Excel', 'Vim', 'Harpic', 'Lizol', 'Local Select'],
  'Personal Care': ['Colgate', 'Dove', 'Clinic Plus', 'Nivea', 'Local Select'],
  'Medical Store': ['Cipla', 'Himalaya', 'Dabur', 'Local Select'],
  'Frozen & Ready': ['ITC', 'MTR', 'Gits', 'McCain', 'Local Select'],
};

const CATEGORY_IMAGE_URLS = {
  Kirana: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500',
  Staples: 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=500',
  Flours: 'https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=500',
  Pulses: 'https://images.pexels.com/photos/7421210/pexels-photo-7421210.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Oils & Ghee': 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=500',
  Spices: 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=500',
  Dairy: 'https://images.pexels.com/photos/416656/pexels-photo-416656.jpeg?auto=compress&cs=tinysrgb&w=500',
  Eggs: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Fresh Vegetables': 'https://images.pexels.com/photos/264537/pexels-photo-264537.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Fresh Fruits': 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Fresh Herbs': 'https://images.pexels.com/photos/4198023/pexels-photo-4198023.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Meat & Fish': 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=500',
  Bakery: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=500',
  Snacks: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=500',
  Beverages: 'https://images.pexels.com/photos/1282279/pexels-photo-1282279.jpeg?auto=compress&cs=tinysrgb&w=500',
  Sweets: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Party Supplies': 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=500',
  Household: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Personal Care': 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Medical Store': 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=500',
  'Frozen & Ready': 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=500',
};

const PRODUCT_IMAGE_OVERRIDES = {
  'basmati-rice': 'https://m.media-amazon.com/images/I/716IEKwQvoL.jpg',
  'wheat-flour': 'https://odhi.in/image/cache/catalog/grocery/flour-rava/aashirvaad-atta-whole-wheat-2-kg-front-sale-online-coimbatore-1000x1000.jpg',
  'turmeric-powder': 'https://www.bbassets.com/media/uploads/p/l/40019828_4-catch-turmeric-powder.jpg',
  'red-chilli-powder': 'https://m.media-amazon.com/images/I/611XUlpeUYL.jpg',
  'coriander-powder': 'https://shop.mtrfoods.com/cdn/shop/products/CorianderPowder-100g-frontcopy.png?v=1611249400',
  'cumin-seeds': 'https://www.tatanutrikorner.com/cdn/shop/files/cumin_100.png?v=1748858411',
  'mustard-oil': 'https://www.bbassets.com/media/uploads/p/xl/276756_11-fortune-fortune-premium-kachi-ghani-pure-mustard-oil.jpg',
  salt: 'https://m.media-amazon.com/images/I/614mm2hYHyL._UF894,1000_QL80_.jpg',
  'moong-dal': 'https://www.tatanutrikorner.com/cdn/shop/files/Tata-Sampann-Moong-Dal-500g-_FOP_-with-Sanjeev-kapoor.png?v=1748858300&width=1000',
  'chana-dal': 'https://m.media-amazon.com/images/I/61NZt0SHUgL._UF1000,1000_QL80_.jpg',
  milk: 'https://www.bbassets.com/media/uploads/p/l/306926_4-amul-homogenised-toned-milk.jpg',
  curd: 'https://www.bbassets.com/media/uploads/p/l/40332424_1-amul-curd-creamy-tasty.jpg',
  butter: 'https://www.bbassets.com/media/uploads/p/xl/104860_8-amul-butter-pasteurised.jpg',
  paneer: 'https://www.bbassets.com/media/uploads/p/l/40096747_8-amul-malai-fresh-paneer.jpg',
  ghee: 'https://m.media-amazon.com/images/I/81DaNTeNErL._UF1000,1000_QL80_.jpg',
  'cheese-slices': 'https://m.media-amazon.com/images/I/710E8gugmfL.jpg',
  'mineral-water': 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=500',
  tomato: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=500',
  onion: 'https://images.pexels.com/photos/4197447/pexels-photo-4197447.jpeg?auto=compress&cs=tinysrgb&w=500',
  potato: 'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=500',
  carrot: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=500',
  spinach: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg?auto=compress&cs=tinysrgb&w=500',
  brinjal: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&cs=tinysrgb&w=500',
  lemon: 'https://images.pexels.com/photos/1414130/pexels-photo-1414130.jpeg?auto=compress&cs=tinysrgb&w=500',
  banana: 'https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg?auto=compress&cs=tinysrgb&w=500',
  apple: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=500',
  eggs: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=500',
  'chicken-curry-cut': 'https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=500',
  'rohu-fish': 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=500',
  prawns: 'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=500',
  bread: 'https://images.pexels.com/photos/209206/pexels-photo-209206.jpeg?auto=compress&cs=tinysrgb&w=500',
  'potato-chips': 'https://images.pexels.com/photos/479628/pexels-photo-479628.jpeg?auto=compress&cs=tinysrgb&w=500',
  popcorn: 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=500',
  cashews: 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=500',
  raisins: 'https://images.pexels.com/photos/4198124/pexels-photo-4198124.jpeg?auto=compress&cs=tinysrgb&w=500',
  'soft-drink-cola': 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=500',
  'fruit-juice': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=500',
  'paper-plates': 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=500',
  'detergent-powder': 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=500',
  'toothpaste': 'https://images.pexels.com/photos/298611/pexels-photo-298611.jpeg?auto=compress&cs=tinysrgb&w=500',
  paracetamol: 'https://digitalcontent.api.tesco.com/v2/media/ghs/c322593f-ea2e-4b4e-adec-cd908a717551/61a7b7b3-e1a0-4335-862d-9dc170dc4511_1042002236.jpeg?h=960&w=960',
};

const INGREDIENT_CATALOG = [
  p('basmati rice', 'Staples', 'Rice', 'weight', { quantity: 1, unit: 'kg' }, 145, ['biryani rice', 'long grain rice', 'chawal'], ['biryani', 'pulao', 'fried rice'], ['rice']),
  p('gobindobhog rice', 'Staples', 'Rice', 'weight', { quantity: 1, unit: 'kg' }, 120, ['aromatic rice', 'bengali rice'], ['khichdi', 'payesh'], ['rice']),
  p('sona masoori rice', 'Staples', 'Rice', 'weight', { quantity: 1, unit: 'kg' }, 80, ['daily rice'], ['daily meal'], ['rice']),
  p('poha', 'Staples', 'Flattened rice', 'weight', { quantity: 500, unit: 'g' }, 55, ['chire', 'flattened rice'], ['breakfast', 'snack'], ['breakfast-grain']),
  p('suji', 'Staples', 'Semolina', 'weight', { quantity: 500, unit: 'g' }, 45, ['rava', 'semolina'], ['upma', 'halwa'], ['breakfast-grain']),
  p('sabudana', 'Staples', 'Tapioca', 'weight', { quantity: 500, unit: 'g' }, 80, ['sago'], ['fasting', 'khichdi'], ['breakfast-grain']),
  p('vermicelli', 'Staples', 'Noodles', 'weight', { quantity: 500, unit: 'g' }, 60, ['seviyan', 'semai'], ['payesh', 'breakfast'], ['noodle']),
  p('puffed rice', 'Staples', 'Rice snack', 'weight', { quantity: 500, unit: 'g' }, 50, ['muri', 'murmura'], ['jhal muri', 'snack'], ['snack-base']),
  p('wheat flour', 'Flours', 'Atta', 'weight', { quantity: 5, unit: 'kg' }, 260, ['atta', 'aata'], ['roti', 'paratha', 'poori'], ['flour']),
  p('maida', 'Flours', 'Refined flour', 'weight', { quantity: 1, unit: 'kg' }, 58, ['all purpose flour'], ['naan', 'luchi', 'cake'], ['flour']),
  p('besan', 'Flours', 'Gram flour', 'weight', { quantity: 500, unit: 'g' }, 70, ['gram flour', 'chickpea flour'], ['pakora', 'dhokla', 'besan chilla'], ['flour']),
  p('rice flour', 'Flours', 'Rice flour', 'weight', { quantity: 500, unit: 'g' }, 55, ['chawal atta'], ['dosa', 'pitha'], ['flour']),
  p('corn flour', 'Flours', 'Corn starch', 'weight', { quantity: 500, unit: 'g' }, 75, ['corn starch'], ['chinese', 'thickener'], ['thickener']),
  p('moong dal', 'Pulses', 'Dal', 'weight', { quantity: 500, unit: 'g' }, 80, ['mung dal'], ['dal', 'khichdi'], ['lentil']),
  p('masoor dal', 'Pulses', 'Dal', 'weight', { quantity: 500, unit: 'g' }, 75, ['red lentil'], ['dal'], ['lentil']),
  p('toor dal', 'Pulses', 'Dal', 'weight', { quantity: 500, unit: 'g' }, 95, ['arhar dal'], ['sambar', 'dal tadka'], ['lentil']),
  p('chana dal', 'Pulses', 'Dal', 'weight', { quantity: 500, unit: 'g' }, 70, ['split chickpea'], ['dal', 'lau chana'], ['lentil']),
  p('urad dal', 'Pulses', 'Dal', 'weight', { quantity: 500, unit: 'g' }, 90, ['biuli dal'], ['dosa', 'idli', 'dal makhani'], ['lentil']),
  p('rajma', 'Pulses', 'Beans', 'weight', { quantity: 500, unit: 'g' }, 120, ['kidney beans'], ['rajma chawal'], ['beans']),
  p('kabuli chana', 'Pulses', 'Chickpeas', 'weight', { quantity: 500, unit: 'g' }, 100, ['chole', 'white chickpeas'], ['chole', 'chana masala'], ['beans']),
  p('black chana', 'Pulses', 'Chickpeas', 'weight', { quantity: 500, unit: 'g' }, 85, ['kala chana'], ['ghugni', 'chana'], ['beans']),
  p('mustard oil', 'Oils & Ghee', 'Cooking oil', 'volume', { quantity: 1, unit: 'l' }, 180, ['sarson oil', 'sorsher tel'], ['fish curry', 'bengali'], ['cooking-oil']),
  p('refined sunflower oil', 'Oils & Ghee', 'Cooking oil', 'volume', { quantity: 1, unit: 'l' }, 150, ['sunflower oil', 'refined oil'], ['daily cooking'], ['cooking-oil']),
  p('rice bran oil', 'Oils & Ghee', 'Cooking oil', 'volume', { quantity: 1, unit: 'l' }, 160, ['healthy oil'], ['daily cooking'], ['cooking-oil']),
  p('groundnut oil', 'Oils & Ghee', 'Cooking oil', 'volume', { quantity: 1, unit: 'l' }, 190, ['peanut oil'], ['south indian'], ['cooking-oil']),
  p('ghee', 'Oils & Ghee', 'Ghee', 'volume', { quantity: 500, unit: 'ml' }, 320, ['clarified butter'], ['biryani', 'dal', 'sweets'], ['fat']),
  p('butter', 'Dairy', 'Butter', 'weight', { quantity: 100, unit: 'g' }, 60, ['makhan'], ['breakfast', 'paneer butter masala'], ['fat']),
  p('turmeric powder', 'Spices', 'Powdered spice', 'weight', { quantity: 100, unit: 'g' }, 45, ['haldi', 'holud'], ['curry', 'dal'], ['spice']),
  p('red chilli powder', 'Spices', 'Powdered spice', 'weight', { quantity: 100, unit: 'g' }, 55, ['lal mirch', 'chilli powder'], ['curry'], ['spice']),
  p('kashmiri chilli powder', 'Spices', 'Powdered spice', 'weight', { quantity: 100, unit: 'g' }, 75, ['kashmiri mirch'], ['biryani', 'paneer', 'color'], ['spice']),
  p('coriander powder', 'Spices', 'Powdered spice', 'weight', { quantity: 100, unit: 'g' }, 50, ['dhania powder'], ['curry'], ['spice']),
  p('cumin powder', 'Spices', 'Powdered spice', 'weight', { quantity: 100, unit: 'g' }, 60, ['jeera powder'], ['curry', 'raita'], ['spice']),
  p('garam masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 90, ['masala mix', 'whole spice mix'], ['biryani', 'curry'], ['indian-spice-mix']),
  p('biryani masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 95, ['biryani spice mix', 'dum masala'], ['biryani'], ['indian-spice-mix']),
  p('chicken masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 85, ['chicken curry masala'], ['chicken curry'], ['indian-spice-mix']),
  p('meat masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 90, ['mutton masala'], ['mutton curry'], ['indian-spice-mix']),
  p('fish curry masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 80, ['fish masala'], ['fish curry'], ['indian-spice-mix']),
  p('sambar masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 75, ['sambar powder'], ['sambar', 'idli'], ['south-indian-mix']),
  p('pav bhaji masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 75, ['bhaji masala'], ['pav bhaji'], ['indian-spice-mix']),
  p('chaat masala', 'Spices', 'Spice blend', 'weight', { quantity: 100, unit: 'g' }, 70, ['chat masala'], ['snack', 'salad'], ['indian-spice-mix']),
  p('cumin seeds', 'Spices', 'Whole spice', 'weight', { quantity: 100, unit: 'g' }, 55, ['jeera'], ['tadka', 'curry'], ['whole-spice']),
  p('mustard seeds', 'Spices', 'Whole spice', 'weight', { quantity: 100, unit: 'g' }, 45, ['rai', 'sorshe'], ['fish curry', 'tadka'], ['whole-spice']),
  p('fennel seeds', 'Spices', 'Whole spice', 'weight', { quantity: 100, unit: 'g' }, 65, ['saunf', 'mouri'], ['biryani', 'tea'], ['whole-spice']),
  p('fenugreek seeds', 'Spices', 'Whole spice', 'weight', { quantity: 100, unit: 'g' }, 45, ['methi seeds'], ['pickle', 'curry'], ['whole-spice']),
  p('black pepper', 'Spices', 'Whole spice', 'weight', { quantity: 100, unit: 'g' }, 100, ['peppercorn', 'gol morich'], ['soup', 'curry'], ['whole-spice']),
  p('bay leaves', 'Spices', 'Whole spice', 'weight', { quantity: 50, unit: 'g' }, 35, ['tej patta'], ['biryani', 'pulao'], ['whole-spice']),
  p('green cardamom', 'Spices', 'Whole spice', 'weight', { quantity: 50, unit: 'g' }, 180, ['elaichi', 'elach'], ['biryani', 'sweets', 'tea'], ['whole-spice']),
  p('black cardamom', 'Spices', 'Whole spice', 'weight', { quantity: 50, unit: 'g' }, 160, ['badi elaichi'], ['biryani', 'mutton'], ['whole-spice']),
  p('cinnamon', 'Spices', 'Whole spice', 'weight', { quantity: 50, unit: 'g' }, 70, ['dalchini'], ['biryani', 'tea'], ['whole-spice']),
  p('cloves', 'Spices', 'Whole spice', 'weight', { quantity: 50, unit: 'g' }, 90, ['laung', 'lobongo'], ['biryani', 'tea'], ['whole-spice']),
  p('star anise', 'Spices', 'Whole spice', 'weight', { quantity: 25, unit: 'g' }, 80, ['chakri phool'], ['biryani'], ['whole-spice']),
  p('mace', 'Spices', 'Whole spice', 'weight', { quantity: 25, unit: 'g' }, 120, ['javitri'], ['biryani', 'mughlai'], ['whole-spice']),
  p('nutmeg', 'Spices', 'Whole spice', 'weight', { quantity: 25, unit: 'g' }, 110, ['jaiphal'], ['biryani', 'sweets'], ['whole-spice']),
  p('asafoetida', 'Spices', 'Powdered spice', 'weight', { quantity: 50, unit: 'g' }, 85, ['hing'], ['dal', 'tadka'], ['spice']),
  p('kasuri methi', 'Spices', 'Dried herb', 'weight', { quantity: 50, unit: 'g' }, 75, ['dried fenugreek leaves'], ['paneer', 'butter chicken'], ['dried-herb']),
  p('salt', 'Staples', 'Seasoning', 'weight', { quantity: 1, unit: 'kg' }, 25, ['namak', 'lobon'], ['daily cooking'], ['seasoning']),
  p('sugar', 'Staples', 'Sweetener', 'weight', { quantity: 1, unit: 'kg' }, 55, ['chini'], ['tea', 'sweets'], ['sweetener']),
  p('jaggery', 'Staples', 'Sweetener', 'weight', { quantity: 500, unit: 'g' }, 65, ['gur'], ['sweets', 'payesh'], ['sweetener']),
  p('tea leaves', 'Beverages', 'Tea', 'weight', { quantity: 250, unit: 'g' }, 120, ['chai patti'], ['tea', 'breakfast'], ['tea']),
  p('coffee powder', 'Beverages', 'Coffee', 'weight', { quantity: 100, unit: 'g' }, 95, ['instant coffee'], ['coffee'], ['coffee']),
  p('onion', 'Fresh Vegetables', 'Allium', 'weight', { quantity: 1, unit: 'kg' }, 40, ['pyaz', 'peyaj'], ['biryani', 'curry', 'salad'], ['allium']),
  p('potato', 'Fresh Vegetables', 'Root vegetable', 'weight', { quantity: 1, unit: 'kg' }, 35, ['aloo'], ['biryani', 'curry', 'snack'], ['root-vegetable']),
  p('tomato', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 1, unit: 'kg' }, 45, ['tamatar'], ['curry', 'salad'], ['vegetable']),
  p('ginger', 'Fresh Vegetables', 'Aromatic', 'weight', { quantity: 250, unit: 'g' }, 35, ['adrak', 'ada'], ['curry', 'tea'], ['aromatic']),
  p('garlic', 'Fresh Vegetables', 'Aromatic', 'weight', { quantity: 250, unit: 'g' }, 45, ['lahsun', 'rosun'], ['curry'], ['aromatic']),
  p('ginger garlic paste', 'Spices', 'Paste', 'weight', { quantity: 200, unit: 'g' }, 65, ['adrak lehsun paste'], ['biryani', 'curry'], ['aromatic-paste']),
  p('green chilli', 'Fresh Vegetables', 'Chilli', 'weight', { quantity: 100, unit: 'g' }, 18, ['hari mirch', 'kancha lonka'], ['curry', 'chutney'], ['chilli']),
  p('lemon', 'Fresh Fruits', 'Citrus', 'weight', { quantity: 500, unit: 'g' }, 35, ['nimbu', 'lebu'], ['fish curry', 'salad', 'party'], ['citrus']),
  p('coriander leaves', 'Fresh Herbs', 'Herb', 'weight', { quantity: 100, unit: 'g' }, 20, ['dhania patta', 'cilantro'], ['garnish', 'chutney'], ['fresh-herb']),
  p('mint leaves', 'Fresh Herbs', 'Herb', 'weight', { quantity: 100, unit: 'g' }, 25, ['pudina'], ['biryani', 'chutney', 'raita'], ['fresh-herb']),
  p('curry leaves', 'Fresh Herbs', 'Herb', 'weight', { quantity: 50, unit: 'g' }, 15, ['kari patta'], ['south indian', 'tadka'], ['fresh-herb']),
  p('carrot', 'Fresh Vegetables', 'Root vegetable', 'weight', { quantity: 500, unit: 'g' }, 35, ['gajar'], ['fried rice', 'salad'], ['vegetable']),
  p('cauliflower', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 1, unit: 'kg' }, 50, ['phool gobi'], ['curry', 'pulao'], ['vegetable']),
  p('cabbage', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 1, unit: 'kg' }, 35, ['bandh gobi'], ['chowmein', 'momo'], ['vegetable']),
  p('beans', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 500, unit: 'g' }, 45, ['green beans'], ['fried rice', 'sabzi'], ['vegetable']),
  p('green peas', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 500, unit: 'g' }, 70, ['matar', 'koraishuti'], ['pulao', 'paneer'], ['vegetable']),
  p('capsicum', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 500, unit: 'g' }, 65, ['bell pepper', 'shimla mirch'], ['chinese', 'paneer'], ['vegetable']),
  p('brinjal', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 500, unit: 'g' }, 45, ['eggplant', 'baingan', 'begun'], ['bharta', 'curry'], ['vegetable']),
  p('spinach', 'Fresh Vegetables', 'Leafy vegetable', 'weight', { quantity: 250, unit: 'g' }, 30, ['palak'], ['palak paneer', 'saag'], ['leafy-vegetable']),
  p('okra', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 500, unit: 'g' }, 45, ['bhindi', 'ladies finger'], ['sabzi'], ['vegetable']),
  p('pumpkin', 'Fresh Vegetables', 'Vegetable', 'weight', { quantity: 1, unit: 'kg' }, 40, ['kaddu', 'kumro'], ['sabzi', 'dal'], ['vegetable']),
  p('bottle gourd', 'Fresh Vegetables', 'Vegetable', 'count', { quantity: 1, unit: 'pcs' }, 45, ['lauki', 'lau'], ['lau chana', 'sabzi'], ['vegetable']),
  p('banana', 'Fresh Fruits', 'Fruit', 'weight', { quantity: 1, unit: 'kg' }, 55, ['kela'], ['breakfast', 'snack'], ['fruit']),
  p('apple', 'Fresh Fruits', 'Fruit', 'weight', { quantity: 1, unit: 'kg' }, 180, ['seb'], ['fruit salad'], ['fruit']),
  p('orange', 'Fresh Fruits', 'Fruit', 'weight', { quantity: 1, unit: 'kg' }, 110, ['santra'], ['juice', 'fruit'], ['fruit']),
  p('mango', 'Fresh Fruits', 'Fruit', 'weight', { quantity: 1, unit: 'kg' }, 140, ['aam'], ['dessert', 'party'], ['fruit']),
  p('watermelon', 'Fresh Fruits', 'Fruit', 'weight', { quantity: 2, unit: 'kg' }, 80, ['tarbooz'], ['party', 'juice'], ['fruit']),
  p('coconut', 'Fresh Fruits', 'Coconut', 'count', { quantity: 1, unit: 'pcs' }, 45, ['nariyal', 'narikel'], ['chutney', 'south indian', 'sweets'], ['coconut']),
  p('milk', 'Dairy', 'Milk', 'volume', { quantity: 1, unit: 'l' }, 65, ['doodh'], ['tea', 'breakfast', 'sweets'], ['milk']),
  p('curd', 'Dairy', 'Curd', 'weight', { quantity: 500, unit: 'g' }, 45, ['dahi', 'yogurt', 'doi'], ['biryani', 'raita', 'fish curry'], ['sour-dairy']),
  p('paneer', 'Dairy', 'Paneer', 'weight', { quantity: 200, unit: 'g' }, 95, ['cottage cheese'], ['paneer curry', 'party'], ['paneer']),
  p('cheese slices', 'Dairy', 'Cheese', 'count', { quantity: 10, unit: 'pcs' }, 130, ['processed cheese'], ['sandwich', 'party'], ['cheese']),
  p('cream', 'Dairy', 'Cream', 'volume', { quantity: 200, unit: 'ml' }, 75, ['fresh cream', 'malai'], ['butter chicken', 'paneer'], ['cream']),
  p('buttermilk', 'Dairy', 'Buttermilk', 'volume', { quantity: 1, unit: 'l' }, 40, ['chaas', 'ghol'], ['summer', 'meal'], ['drink']),
  p('eggs', 'Eggs', 'Eggs', 'count', { quantity: 12, unit: 'pcs' }, 90, ['anda', 'dim'], ['egg curry', 'breakfast', 'cake'], ['egg']),
  p('chicken curry cut', 'Meat & Fish', 'Chicken', 'weight', { quantity: 500, unit: 'g' }, 190, ['chicken pieces'], ['chicken curry', 'biryani'], ['chicken']),
  p('chicken breast', 'Meat & Fish', 'Chicken', 'weight', { quantity: 500, unit: 'g' }, 230, ['boneless chicken'], ['grill', 'fried rice'], ['chicken']),
  p('mutton curry cut', 'Meat & Fish', 'Mutton', 'weight', { quantity: 500, unit: 'g' }, 420, ['goat meat'], ['mutton curry', 'biryani'], ['mutton']),
  p('rohu fish', 'Meat & Fish', 'Fish', 'weight', { quantity: 500, unit: 'g' }, 180, ['rui fish'], ['fish curry', 'bengali'], ['fish']),
  p('katla fish', 'Meat & Fish', 'Fish', 'weight', { quantity: 500, unit: 'g' }, 190, ['catla fish'], ['fish curry', 'bengali'], ['fish']),
  p('hilsa fish', 'Meat & Fish', 'Fish', 'weight', { quantity: 500, unit: 'g' }, 650, ['ilish'], ['bengali fish curry'], ['fish']),
  p('prawns', 'Meat & Fish', 'Seafood', 'weight', { quantity: 500, unit: 'g' }, 420, ['chingri', 'shrimp'], ['malai curry', 'fried rice'], ['seafood']),
  p('bread', 'Bakery', 'Bread', 'weight', { quantity: 400, unit: 'g' }, 45, ['white bread'], ['breakfast', 'sandwich'], ['bread']),
  p('brown bread', 'Bakery', 'Bread', 'weight', { quantity: 400, unit: 'g' }, 55, ['whole wheat bread'], ['breakfast'], ['bread']),
  p('pav buns', 'Bakery', 'Buns', 'count', { quantity: 6, unit: 'pcs' }, 45, ['ladi pav'], ['pav bhaji', 'party'], ['bread']),
  p('pizza base', 'Bakery', 'Pizza base', 'count', { quantity: 2, unit: 'pcs' }, 70, ['ready pizza base'], ['party', 'pizza'], ['bread']),
  p('plain cake', 'Bakery', 'Cake', 'weight', { quantity: 250, unit: 'g' }, 120, ['tea cake'], ['party', 'tea'], ['cake']),
  p('maggi noodles', 'Frozen & Ready', 'Instant noodles', 'count', { quantity: 4, unit: 'pcs' }, 60, ['instant noodles'], ['snack', 'late night'], ['instant-food']),
  p('hakka noodles', 'Frozen & Ready', 'Noodles', 'weight', { quantity: 500, unit: 'g' }, 85, ['chowmein noodles'], ['chowmein', 'party'], ['noodle']),
  p('idli dosa batter', 'Frozen & Ready', 'Batter', 'weight', { quantity: 1, unit: 'kg' }, 90, ['dosa batter', 'idli batter'], ['breakfast', 'south indian'], ['batter']),
  p('frozen green peas', 'Frozen & Ready', 'Frozen vegetables', 'weight', { quantity: 500, unit: 'g' }, 95, ['matar frozen'], ['pulao', 'paneer'], ['vegetable']),
  p('frozen french fries', 'Frozen & Ready', 'Frozen snack', 'weight', { quantity: 500, unit: 'g' }, 140, ['fries'], ['party', 'snack'], ['party-snack']),
  p('potato chips', 'Snacks', 'Chips', 'weight', { quantity: 100, unit: 'g' }, 35, ['chips', 'lays'], ['party', 'snack'], ['party-snack']),
  p('namkeen', 'Snacks', 'Namkeen', 'weight', { quantity: 400, unit: 'g' }, 95, ['mixture', 'chanachur'], ['party', 'snack'], ['party-snack']),
  p('bhujia', 'Snacks', 'Namkeen', 'weight', { quantity: 200, unit: 'g' }, 55, ['aloo bhujia'], ['party', 'snack'], ['party-snack']),
  p('biscuits', 'Snacks', 'Biscuits', 'weight', { quantity: 300, unit: 'g' }, 45, ['cookies'], ['tea', 'snack'], ['biscuit']),
  p('popcorn', 'Snacks', 'Popcorn', 'weight', { quantity: 100, unit: 'g' }, 40, ['microwave popcorn'], ['movie night', 'party'], ['party-snack']),
  p('peanuts', 'Snacks', 'Nuts', 'weight', { quantity: 250, unit: 'g' }, 60, ['moongfali', 'badam'], ['snack', 'party'], ['nuts']),
  p('cashews', 'Snacks', 'Nuts', 'weight', { quantity: 100, unit: 'g' }, 140, ['kaju'], ['biryani', 'sweets', 'party'], ['nuts']),
  p('raisins', 'Snacks', 'Dry fruits', 'weight', { quantity: 200, unit: 'g' }, 90, ['kishmish'], ['sweets', 'biryani'], ['dry-fruit']),
  p('soft drink cola', 'Beverages', 'Soft drink', 'volume', { quantity: 2, unit: 'l' }, 100, ['coke', 'pepsi', 'cola'], ['party'], ['cold-drink']),
  p('lemon soda', 'Beverages', 'Soft drink', 'volume', { quantity: 2, unit: 'l' }, 95, ['sprite', '7up'], ['party'], ['cold-drink']),
  p('fruit juice', 'Beverages', 'Juice', 'volume', { quantity: 1, unit: 'l' }, 115, ['mixed fruit juice'], ['party', 'breakfast'], ['juice']),
  p('mineral water', 'Beverages', 'Water', 'volume', { quantity: 1, unit: 'l' }, 20, ['water bottle'], ['party', 'daily'], ['water']),
  p('soda water', 'Beverages', 'Soda', 'volume', { quantity: 750, unit: 'ml' }, 35, ['club soda'], ['party'], ['soda']),
  p('ice cubes', 'Beverages', 'Ice', 'weight', { quantity: 1, unit: 'kg' }, 50, ['ice'], ['party'], ['ice']),
  p('rasgulla', 'Sweets', 'Bengali sweets', 'count', { quantity: 10, unit: 'pcs' }, 160, ['rosogolla'], ['party', 'dessert'], ['sweet']),
  p('gulab jamun', 'Sweets', 'Indian sweets', 'count', { quantity: 10, unit: 'pcs' }, 150, ['gulabjamun'], ['party', 'dessert'], ['sweet']),
  p('mishti doi', 'Sweets', 'Sweet curd', 'weight', { quantity: 500, unit: 'g' }, 90, ['sweet yogurt', 'misti doi'], ['party', 'dessert'], ['sweet-dairy']),
  p('paper plates', 'Party Supplies', 'Disposables', 'count', { quantity: 25, unit: 'pcs' }, 80, ['disposable plates'], ['party'], ['party-supply']),
  p('paper cups', 'Party Supplies', 'Disposables', 'count', { quantity: 50, unit: 'pcs' }, 90, ['disposable cups'], ['party'], ['party-supply']),
  p('tissue paper', 'Party Supplies', 'Disposables', 'count', { quantity: 100, unit: 'pcs' }, 55, ['napkins'], ['party', 'household'], ['party-supply']),
  p('garbage bags', 'Party Supplies', 'Cleanup', 'count', { quantity: 10, unit: 'pcs' }, 70, ['trash bags'], ['party', 'household'], ['cleanup']),
  p('birthday candles', 'Party Supplies', 'Decor', 'count', { quantity: 24, unit: 'pcs' }, 45, ['cake candles'], ['party', 'birthday'], ['party-supply']),
  p('balloons', 'Party Supplies', 'Decor', 'count', { quantity: 50, unit: 'pcs' }, 120, ['party balloons'], ['party', 'birthday'], ['party-supply']),
  p('detergent powder', 'Household', 'Laundry', 'weight', { quantity: 1, unit: 'kg' }, 140, ['washing powder'], ['household'], ['cleaning']),
  p('dishwash gel', 'Household', 'Dishwash', 'volume', { quantity: 500, unit: 'ml' }, 110, ['dish soap', 'vim gel'], ['household'], ['cleaning']),
  p('floor cleaner', 'Household', 'Cleaner', 'volume', { quantity: 1, unit: 'l' }, 120, ['lizol'], ['household'], ['cleaning']),
  p('toilet cleaner', 'Household', 'Cleaner', 'volume', { quantity: 500, unit: 'ml' }, 95, ['harpic'], ['household'], ['cleaning']),
  p('handwash', 'Personal Care', 'Hygiene', 'volume', { quantity: 250, unit: 'ml' }, 90, ['liquid hand wash'], ['hygiene'], ['personal-care']),
  p('toothpaste', 'Personal Care', 'Dental', 'weight', { quantity: 100, unit: 'g' }, 95, ['colgate'], ['daily'], ['personal-care']),
  p('soap', 'Personal Care', 'Bath', 'count', { quantity: 4, unit: 'pcs' }, 120, ['bath soap'], ['daily'], ['personal-care']),
  p('shampoo', 'Personal Care', 'Hair care', 'volume', { quantity: 180, unit: 'ml' }, 150, ['hair shampoo'], ['daily'], ['personal-care']),
  p('sanitary pads', 'Personal Care', 'Hygiene', 'count', { quantity: 20, unit: 'pcs' }, 180, ['pads'], ['hygiene'], ['personal-care']),
  p('paracetamol', 'Medical Store', 'Medicine', 'count', { quantity: 10, unit: 'pcs' }, 20, ['acetaminophen', 'fever tablet'], ['medicine'], ['medicine']),
  p('ors sachet', 'Medical Store', 'Medicine', 'count', { quantity: 5, unit: 'pcs' }, 50, ['oral rehydration salts'], ['medicine'], ['medicine']),
  p('bandage roll', 'Medical Store', 'First aid', 'count', { quantity: 1, unit: 'pcs' }, 55, ['crepe bandage'], ['first aid'], ['first-aid']),
  p('antiseptic liquid', 'Medical Store', 'First aid', 'volume', { quantity: 100, unit: 'ml' }, 70, ['dettol antiseptic'], ['first aid'], ['first-aid']),
  p('cough syrup', 'Medical Store', 'Medicine', 'volume', { quantity: 100, unit: 'ml' }, 95, ['khansi syrup'], ['medicine'], ['medicine']),
];

const RECIPE_USE_CASES = [
  {
    id: 'chicken-biryani',
    title: 'Chicken biryani for 4',
    aliases: ['biryani', 'dum biryani', 'kolkata biryani'],
    requiredIngredientIds: ['basmati-rice', 'chicken-curry-cut', 'onion', 'potato', 'curd', 'ginger-garlic-paste', 'biryani-masala', 'ghee', 'mint-leaves', 'coriander-leaves', 'bay-leaves', 'green-cardamom', 'cinnamon', 'cloves'],
  },
  {
    id: 'bengali-fish-curry',
    title: 'Bengali fish curry',
    aliases: ['fish curry', 'macher jhol'],
    requiredIngredientIds: ['rohu-fish', 'mustard-oil', 'potato', 'tomato', 'turmeric-powder', 'red-chilli-powder', 'cumin-seeds', 'green-chilli', 'coriander-leaves'],
  },
  {
    id: 'paneer-butter-masala',
    title: 'Paneer butter masala',
    aliases: ['paneer curry', 'party paneer'],
    requiredIngredientIds: ['paneer', 'butter', 'cream', 'onion', 'tomato', 'ginger-garlic-paste', 'garam-masala', 'kasuri-methi', 'kashmiri-chilli-powder'],
  },
  {
    id: 'house-party',
    title: 'Small house party tonight',
    aliases: ['party snacks', 'guests coming', 'movie night'],
    requiredIngredientIds: ['potato-chips', 'namkeen', 'soft-drink-cola', 'lemon-soda', 'fruit-juice', 'mineral-water', 'ice-cubes', 'paper-plates', 'paper-cups', 'tissue-paper', 'garbage-bags'],
  },
  {
    id: 'south-indian-breakfast',
    title: 'South Indian breakfast',
    aliases: ['idli dosa', 'dosa breakfast'],
    requiredIngredientIds: ['idli-dosa-batter', 'sambar-masala', 'toor-dal', 'curry-leaves', 'mustard-seeds', 'coconut', 'green-chilli'],
  },
  {
    id: 'egg-curry',
    title: 'Egg curry dinner',
    aliases: ['anda curry', 'dim curry'],
    requiredIngredientIds: ['eggs', 'onion', 'tomato', 'potato', 'ginger-garlic-paste', 'turmeric-powder', 'red-chilli-powder', 'garam-masala', 'coriander-leaves'],
  },
  {
    id: 'dal-rice',
    title: 'Simple dal rice meal',
    aliases: ['dal chawal', 'daily lunch'],
    requiredIngredientIds: ['sona-masoori-rice', 'moong-dal', 'turmeric-powder', 'cumin-seeds', 'asafoetida', 'ghee', 'green-chilli'],
  },
  {
    id: 'khichdi',
    title: 'Comfort khichdi',
    aliases: ['moong dal khichdi', 'bengali khichuri'],
    requiredIngredientIds: ['gobindobhog-rice', 'moong-dal', 'potato', 'cauliflower', 'green-peas', 'turmeric-powder', 'bay-leaves', 'ghee'],
  },
  {
    id: 'chole',
    title: 'Chole with roti',
    aliases: ['chana masala', 'chole masala'],
    requiredIngredientIds: ['kabuli-chana', 'onion', 'tomato', 'ginger-garlic-paste', 'garam-masala', 'coriander-powder', 'cumin-powder', 'wheat-flour'],
  },
  {
    id: 'rajma-chawal',
    title: 'Rajma chawal',
    aliases: ['kidney bean curry', 'rajma rice'],
    requiredIngredientIds: ['rajma', 'sona-masoori-rice', 'onion', 'tomato', 'ginger-garlic-paste', 'garam-masala', 'cumin-seeds'],
  },
  {
    id: 'veg-chowmein',
    title: 'Veg chowmein',
    aliases: ['hakka noodles', 'chinese noodles'],
    requiredIngredientIds: ['hakka-noodles', 'cabbage', 'carrot', 'capsicum', 'beans', 'onion', 'garlic', 'green-chilli'],
  },
  {
    id: 'poha-breakfast',
    title: 'Poha breakfast',
    aliases: ['chire breakfast', 'flattened rice breakfast'],
    requiredIngredientIds: ['poha', 'onion', 'potato', 'green-chilli', 'mustard-seeds', 'curry-leaves', 'lemon', 'peanuts'],
  },
  {
    id: 'upma-breakfast',
    title: 'Upma breakfast',
    aliases: ['suji upma', 'rava upma'],
    requiredIngredientIds: ['suji', 'onion', 'green-chilli', 'mustard-seeds', 'curry-leaves', 'carrot', 'green-peas'],
  },
  {
    id: 'pav-bhaji-party',
    title: 'Pav bhaji for guests',
    aliases: ['pav bhaji party', 'street food dinner'],
    requiredIngredientIds: ['pav-buns', 'potato', 'tomato', 'onion', 'capsicum', 'green-peas', 'butter', 'pav-bhaji-masala', 'lemon'],
  },
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
