import fs from 'node:fs';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface RecipeAssistantRequest {
  message: string;
  userLocation: UserLocation;
  radiusKm?: number;
  servings?: number;
  dietaryPreferences?: string[];
}

export interface IngredientIntent {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  acceptableSubstitutes?: string[];
  required?: boolean;
}

export interface RecipePlan {
  title: string;
  servings: number;
  ingredients: IngredientIntent[];
  steps: string[];
  notes?: string[];
  refusal?: boolean;
}

interface ShopDoc {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status?: string;
  deliveryAvailable?: boolean;
  deliveryRadiusKm?: number;
  distanceKm: number;
}

interface ProductDoc {
  id: string;
  shopId: string;
  shopName: string;
  name: string;
  canonicalName?: string;
  normalizedName?: string;
  aliases?: string[];
  category?: string;
  subcategory?: string;
  ingredientTags?: string[];
  substituteGroupIds?: string[];
  unitType?: string;
  packSize?: { quantity?: number; unit?: string };
  price: number;
  originalPrice?: number;
  stock: number;
  inStock: boolean;
  image?: string;
  imageUrl?: string;
  rating?: number;
  searchTokens?: string[];
  searchText?: string;
  shopDistance: number;
  shopStatus?: string;
  deliveryAvailable?: boolean;
}

export interface ProductMatch {
  productId: string;
  shopId: string;
  shopName: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  rating?: number;
  category?: string;
  unitType?: string;
  packSize?: { quantity?: number; unit?: string };
  distanceKm: number;
  confidence: number;
  recommendedQuantity: number;
  matchReasons: string[];
}

export interface IngredientSuggestion {
  intent: IngredientIntent;
  status: 'matched' | 'low_confidence' | 'unmatched';
  matches: ProductMatch[];
}

export interface RecipeAssistantResponse {
  recipe: {
    title: string;
    servings: number;
    steps: string[];
    notes?: string[];
  };
  ingredients: IngredientSuggestion[];
  unmatched: IngredientSuggestion[];
  nearbyShopCount: number;
  radiusKm: number;
}

const MAX_RADIUS_KM = 5;
const MAX_INGREDIENTS = 20;
const GEMINI_CACHE_LIMIT = 50;
const geminiIntentCache = new Map<string, RecipePlan>();

const STOP_WORDS = new Set([
  'fresh',
  'premium',
  'local',
  'select',
  'pack',
  'packet',
  'pcs',
  'piece',
  'pieces',
  'kg',
  'g',
  'gm',
  'ml',
  'l',
  'litre',
  'liter',
  'the',
  'and',
  'or',
  'for',
  'with',
]);

const LOCAL_ALIASES: Record<string, string[]> = {
  curd: ['dahi', 'yogurt', 'doi'],
  eggplant: ['brinjal', 'baingan'],
  brinjal: ['eggplant', 'baingan'],
  'garam masala': ['masala mix', 'whole spice mix'],
  'biryani masala': ['garam masala', 'masala'],
  coriander: ['dhania'],
  cumin: ['jeera'],
  asafoetida: ['hing'],
  'green chili': ['hari mirch', 'chilli', 'chili'],
  'mustard oil': ['sarson oil'],
  rice: ['chawal'],
  'flattened rice': ['poha', 'chire'],
  fish: ['rohu', 'katla', 'hilsa', 'bhetki'],
  chicken: ['poultry'],
  paneer: ['cottage cheese'],
  lentils: ['dal', 'daal'],
  'red lentils': ['masoor dal'],
  'yellow lentils': ['moong dal', 'toor dal', 'arhar dal'],
};

export function validateRecipeAssistantRequest(body: unknown): RecipeAssistantRequest {
  if (!body || typeof body !== 'object') {
    throw new RequestError(400, 'Request body is required.');
  }

  const input = body as Partial<RecipeAssistantRequest>;
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message.length < 3) {
    throw new RequestError(400, 'Please enter a recipe or shopping request.');
  }
  if (message.length > 300) {
    throw new RequestError(400, 'Please keep the request under 300 characters.');
  }

  const lat = Number(input.userLocation?.lat);
  const lng = Number(input.userLocation?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new RequestError(400, 'A valid customer location is required.');
  }

  const radiusKm = Math.min(Math.max(Number(input.radiusKm || MAX_RADIUS_KM), 0.5), MAX_RADIUS_KM);
  const servings = input.servings !== undefined ? Math.min(Math.max(Number(input.servings), 1), 20) : undefined;

  return {
    message,
    userLocation: { lat, lng },
    radiusKm,
    servings: Number.isFinite(servings) ? servings : undefined,
    dietaryPreferences: Array.isArray(input.dietaryPreferences)
      ? input.dietaryPreferences.map(String).slice(0, 6)
      : [],
  };
}

export async function buildRecipeCartSuggestions(
  request: RecipeAssistantRequest,
): Promise<RecipeAssistantResponse> {
  const radiusKm = Math.min(request.radiusKm || MAX_RADIUS_KM, MAX_RADIUS_KM);
  const recipe = await getRecipePlanFromGemini(request);

  if (recipe.refusal) {
    return {
      recipe: {
        title: recipe.title || 'Recipe assistant',
        servings: recipe.servings || request.servings || 1,
        steps: recipe.steps || [],
        notes: recipe.notes || ['Try asking for a recipe, meal, party snack, or grocery cooking plan.'],
      },
      ingredients: [],
      unmatched: [],
      nearbyShopCount: 0,
      radiusKm,
    };
  }

  const db = getFirestore();
  const nearbyShops = await fetchCatalogData(() => fetchNearbyShops(db, request.userLocation, radiusKm));
  if (nearbyShops.length === 0) {
    const ingredients = recipe.ingredients.slice(0, MAX_INGREDIENTS).map((intent) => ({
      intent,
      status: 'unmatched' as const,
      matches: [],
    }));
    return {
      recipe: toResponseRecipe(recipe, request),
      ingredients,
      unmatched: ingredients,
      nearbyShopCount: 0,
      radiusKm,
    };
  }

  const products = await fetchCatalogData(() => fetchProductsForNearbyShops(db, nearbyShops));
  const ingredients = matchIngredientsToProducts(recipe.ingredients, products);

  return {
    recipe: toResponseRecipe(recipe, request),
    ingredients,
    unmatched: ingredients.filter((ingredient) => ingredient.status === 'unmatched'),
    nearbyShopCount: nearbyShops.length,
    radiusKm,
  };
}

async function fetchCatalogData<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new RequestError(503, 'Nearby product catalog is temporarily unavailable. Check Firestore quota and try again.');
    }
    throw new RequestError(502, 'Nearby product catalog could not be loaded right now.');
  }
}

async function getRecipePlanFromGemini(request: RecipeAssistantRequest): Promise<RecipePlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new RequestError(500, 'GEMINI_API_KEY is not configured on the server.');
  }

  const cacheKey = normalizeText(
    JSON.stringify({
      message: request.message,
      servings: request.servings || null,
      dietaryPreferences: request.dietaryPreferences || [],
    }),
  );
  const cached = geminiIntentCache.get(cacheKey);
  if (cached) return cached;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1800,
      responseMimeType: 'application/json',
    },
  });

  const prompt = [
    'You are a recipe-to-grocery intent parser for a Kolkata neighborhood grocery app.',
    'Return only valid JSON. Do not include markdown, product IDs, shop names, prices, or inventory.',
    'Convert the user request into practical Indian grocery ingredient intents.',
    'For vague party or dinner requests, choose a sensible compact shopping plan.',
    'If the request is not about cooking, groceries, snacks, or household food planning, set refusal true.',
    '',
    'JSON schema:',
    '{',
    '  "title": "string",',
    '  "servings": 1,',
    '  "ingredients": [',
    '    { "name": "basmati rice", "quantity": 1000, "unit": "g", "category": "Staples", "acceptableSubstitutes": ["rice"], "required": true }',
    '  ],',
    '  "steps": ["short cooking or shopping step"],',
    '  "notes": ["optional short note"],',
    '  "refusal": false',
    '}',
    '',
    `User request: ${request.message}`,
    request.servings ? `Requested servings: ${request.servings}` : '',
    request.dietaryPreferences?.length
      ? `Dietary preferences: ${request.dietaryPreferences.join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseGeminiRecipeJson(text, request);
    rememberGeminiPlan(cacheKey, parsed);
    return parsed;
  } catch (error) {
    throw normalizeGeminiError(error);
  }
}

function normalizeGeminiError(error: unknown): RequestError {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('[429') || message.toLowerCase().includes('quota')) {
    return new RequestError(503, 'Recipe assistant quota is currently unavailable. Check Gemini billing or quota settings.');
  }
  if (message.includes('[403') || message.toLowerCase().includes('api key')) {
    return new RequestError(503, 'Recipe assistant credentials are not authorized for Gemini.');
  }
  if (message.includes('[404') || message.toLowerCase().includes('not found')) {
    return new RequestError(503, 'Configured Gemini model is not available for this API key.');
  }
  return new RequestError(502, 'Gemini could not generate a recipe plan right now.');
}

function parseGeminiRecipeJson(text: string, request: RecipeAssistantRequest): RecipePlan {
  const jsonText = extractJsonObject(text);
  const parsed = JSON.parse(jsonText) as Partial<RecipePlan>;
  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
        .map(normalizeIngredientIntent)
        .filter((ingredient): ingredient is IngredientIntent => Boolean(ingredient))
        .slice(0, MAX_INGREDIENTS)
    : [];

  if (!parsed.refusal && ingredients.length === 0) {
    throw new RequestError(502, 'Gemini did not return usable ingredient intents.');
  }

  return {
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Shopping plan',
    servings: Number.isFinite(Number(parsed.servings))
      ? Math.min(Math.max(Number(parsed.servings), 1), 20)
      : request.servings || 1,
    ingredients,
    steps: Array.isArray(parsed.steps) ? parsed.steps.map(String).filter(Boolean).slice(0, 8) : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes.map(String).filter(Boolean).slice(0, 4) : undefined,
    refusal: Boolean(parsed.refusal),
  };
}

function normalizeIngredientIntent(input: unknown): IngredientIntent | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<IngredientIntent>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;

  const quantity = Number(raw.quantity);
  return {
    name,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
    unit: typeof raw.unit === 'string' ? raw.unit.trim().toLowerCase() : undefined,
    category: typeof raw.category === 'string' ? raw.category.trim() : undefined,
    acceptableSubstitutes: Array.isArray(raw.acceptableSubstitutes)
      ? raw.acceptableSubstitutes.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : [],
    required: raw.required !== false,
  };
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new RequestError(502, 'Gemini returned invalid JSON.');
  }
  return trimmed.slice(start, end + 1);
}

function rememberGeminiPlan(cacheKey: string, plan: RecipePlan) {
  geminiIntentCache.set(cacheKey, plan);
  if (geminiIntentCache.size > GEMINI_CACHE_LIMIT) {
    const oldestKey = geminiIntentCache.keys().next().value;
    if (oldestKey) geminiIntentCache.delete(oldestKey);
  }
}

function getFirestore() {
  if (!admin.apps.length) {
    const serviceAccount = readServiceAccount();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      });
    }
  }
  return admin.firestore();
}

function readServiceAccount(): admin.ServiceAccount | null {
  const jsonValue = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (jsonValue) {
    const decoded = jsonValue.trim().startsWith('{')
      ? jsonValue
      : Buffer.from(jsonValue, 'base64').toString('utf8');
    return normalizeServiceAccount(JSON.parse(decoded) as Record<string, string>);
  }

  const serviceAccountPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    return normalizeServiceAccount(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as Record<string, string>);
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function normalizeServiceAccount(value: Record<string, string>): admin.ServiceAccount {
  return {
    projectId: value.projectId || value.project_id || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: value.clientEmail || value.client_email,
    privateKey: (value.privateKey || value.private_key || '').replace(/\\n/g, '\n'),
  };
}

async function fetchNearbyShops(
  db: admin.firestore.Firestore,
  userLocation: UserLocation,
  radiusKm: number,
): Promise<ShopDoc[]> {
  const snapshot = await db.collection('shops').get();
  return snapshot.docs
    .map((doc): ShopDoc | null => {
      const data = doc.data();
      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

      const distanceKm = calculateDistance(userLocation.lat, userLocation.lng, latitude, longitude);
      if (distanceKm > radiusKm) return null;
      if (data.deliveryAvailable === false) return null;

      const deliveryRadius = Number(data.deliveryRadiusKm || radiusKm);
      if (Number.isFinite(deliveryRadius) && distanceKm > deliveryRadius) return null;

      return {
        id: doc.id,
        name: String(data.name || 'Shop'),
        latitude,
        longitude,
        status: data.status ? String(data.status) : undefined,
        deliveryAvailable: data.deliveryAvailable !== false,
        deliveryRadiusKm: Number.isFinite(deliveryRadius) ? deliveryRadius : undefined,
        distanceKm,
      };
    })
    .filter((shop): shop is ShopDoc => Boolean(shop))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

async function fetchProductsForNearbyShops(
  db: admin.firestore.Firestore,
  nearbyShops: ShopDoc[],
): Promise<ProductDoc[]> {
  const products: ProductDoc[] = [];
  const shopById = new Map(nearbyShops.map((shop) => [shop.id, shop]));
  const shopIds = nearbyShops.map((shop) => shop.id);

  for (let i = 0; i < shopIds.length; i += 30) {
    const chunk = shopIds.slice(i, i + 30);
    const snapshot = await db.collection('products').where('shopId', 'in', chunk).get();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const shop = shopById.get(String(data.shopId));
      const stock = Number(data.stock ?? 0);
      const price = Number(data.price ?? 0);
      if (!shop || !Number.isFinite(price) || price <= 0) return;
      if (data.inStock === false || stock <= 0) return;

      products.push({
        id: doc.id,
        shopId: String(data.shopId),
        shopName: String(data.shopName || shop.name),
        name: String(data.name || ''),
        canonicalName: data.canonicalName ? String(data.canonicalName) : undefined,
        normalizedName: data.normalizedName ? String(data.normalizedName) : undefined,
        aliases: Array.isArray(data.aliases) ? data.aliases.map(String) : [],
        category: data.category ? String(data.category) : undefined,
        subcategory: data.subcategory ? String(data.subcategory) : undefined,
        ingredientTags: Array.isArray(data.ingredientTags) ? data.ingredientTags.map(String) : [],
        substituteGroupIds: Array.isArray(data.substituteGroupIds) ? data.substituteGroupIds.map(String) : [],
        unitType: data.unitType ? String(data.unitType) : undefined,
        packSize: data.packSize && typeof data.packSize === 'object' ? data.packSize : undefined,
        price,
        originalPrice: Number.isFinite(Number(data.originalPrice)) ? Number(data.originalPrice) : undefined,
        stock,
        inStock: data.inStock !== false,
        image: data.image ? String(data.image) : undefined,
        imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
        rating: Number.isFinite(Number(data.rating)) ? Number(data.rating) : undefined,
        searchTokens: Array.isArray(data.searchTokens) ? data.searchTokens.map(String) : [],
        searchText: data.searchText ? String(data.searchText) : undefined,
        shopDistance: shop.distanceKm,
        shopStatus: shop.status,
        deliveryAvailable: shop.deliveryAvailable,
      });
    });
  }

  return products;
}

function matchIngredientsToProducts(
  ingredients: IngredientIntent[],
  products: ProductDoc[],
): IngredientSuggestion[] {
  const preliminary = ingredients.map((intent) => rankProductsForIntent(intent, products));
  const preferredShopId = choosePreferredShop(preliminary);

  return ingredients.map((intent) => {
    const ranked = rankProductsForIntent(intent, products, preferredShopId).slice(0, 4);
    const confidence = ranked[0]?.confidence || 0;
    const status: IngredientSuggestion['status'] =
      confidence >= 80 ? 'matched' : confidence >= 60 ? 'low_confidence' : 'unmatched';

    return {
      intent,
      status,
      matches: status === 'unmatched' ? ranked.filter((match) => match.confidence >= 45) : ranked,
    };
  });
}

function rankProductsForIntent(
  intent: IngredientIntent,
  products: ProductDoc[],
  preferredShopId?: string,
): ProductMatch[] {
  return products
    .map((product) => scoreProduct(intent, product, preferredShopId))
    .filter((match): match is ProductMatch => Boolean(match) && match.confidence >= 35)
    .sort((a, b) => b.confidence - a.confidence || a.distanceKm - b.distanceKm || a.price - b.price);
}

function scoreProduct(
  intent: IngredientIntent,
  product: ProductDoc,
  preferredShopId?: string,
): ProductMatch | null {
  const primaryIntentNames = expandIngredientNames([intent.name]);
  const substituteIntentNames = expandIngredientNames(intent.acceptableSubstitutes || []);
  const intentTokenSet = new Set(primaryIntentNames.flatMap(tokenize));
  const substituteTokenSet = new Set(substituteIntentNames.flatMap(tokenize));
  const productNames = [
    product.name,
    product.canonicalName,
    product.normalizedName,
    ...(product.aliases || []),
  ].filter(Boolean) as string[];
  const coreProductTokenSet = new Set(productNames.flatMap(tokenize));
  const metadataTokenSet = new Set([...(product.searchTokens || []), ...(product.ingredientTags || [])].flatMap(tokenize));

  const normalizedIntentNames = primaryIntentNames.map(normalizeText);
  const normalizedSubstituteNames = substituteIntentNames.map(normalizeText);
  const normalizedProductNames = productNames.map(normalizeText);
  const normalizedAliases = (product.aliases || []).map(normalizeText);
  if (isSeasoningProductForBaseProteinIntent(intent.name, product)) return null;
  const matchReasons: string[] = [];
  let score = 0;
  let exactMatch = false;
  let aliasMatch = false;
  let substituteOnly = false;

  if (normalizedIntentNames.some((name) => normalizedProductNames.includes(name))) {
    score += 40;
    matchReasons.push('exact name');
    exactMatch = true;
  }

  if (
    normalizedAliases.some((alias) => normalizedIntentNames.includes(alias)) ||
    normalizedIntentNames.some((name) => normalizedAliases.includes(name))
  ) {
    score += 30;
    matchReasons.push('alias');
    aliasMatch = true;
  }

  const coreOverlap = [...intentTokenSet].filter((token) => coreProductTokenSet.has(token));
  const coreOverlapRatio = coreOverlap.length / Math.max(intentTokenSet.size, 1);
  if (coreOverlap.length > 0) {
    score += Math.min(20, Math.round(coreOverlapRatio * 20));
    matchReasons.push('token match');
  }

  if (!exactMatch && !aliasMatch && coreOverlap.length === 0 && substituteTokenSet.size > 0) {
    const substituteExact = normalizedSubstituteNames.some((name) => normalizedProductNames.includes(name));
    const substituteAlias = normalizedSubstituteNames.some((name) => normalizedAliases.includes(name));
    const substituteOverlap = [...substituteTokenSet].filter((token) => coreProductTokenSet.has(token));
    const substituteOverlapRatio = substituteOverlap.length / Math.max(substituteTokenSet.size, 1);

    if (substituteExact) {
      score += 24;
      exactMatch = true;
      substituteOnly = true;
      matchReasons.push('substitute');
    } else if (substituteAlias) {
      score += 20;
      aliasMatch = true;
      substituteOnly = true;
      matchReasons.push('substitute');
    } else if (substituteOverlap.length > 0) {
      score += Math.min(12, Math.round(substituteOverlapRatio * 12));
      substituteOnly = true;
      matchReasons.push('substitute');
    }
  }

  const metadataOverlap = [...intentTokenSet].filter((token) => metadataTokenSet.has(token));
  if (metadataOverlap.length > 0) {
    score += Math.min(8, Math.round((metadataOverlap.length / Math.max(intentTokenSet.size, 1)) * 8));
  }

  const intentCategoryTokens = tokenize(`${intent.category || ''} ${intent.name}`);
  const productCategoryTokens = tokenize(
    `${product.category || ''} ${product.subcategory || ''} ${(product.ingredientTags || []).join(' ')}`,
  );
  if (intentCategoryTokens.some((token) => productCategoryTokens.includes(token))) {
    score += 15;
    matchReasons.push('category');
  }

  if (isUnitCompatible(intent.unit, product.unitType, product.packSize?.unit)) {
    score += 10;
    matchReasons.push('pack size');
  }

  score += 10;
  if (product.shopDistance <= 5) {
    score += Math.max(0, Math.round((1 - product.shopDistance / 5) * 10));
    matchReasons.push('nearby');
  }
  if (product.deliveryAvailable !== false && (product.shopStatus || 'open').toLowerCase() === 'open') {
    score += 10;
    matchReasons.push('open shop');
  }
  if (preferredShopId && product.shopId === preferredShopId) {
    score += 8;
    matchReasons.push('same shop');
  }

  if (!exactMatch && !aliasMatch && coreOverlap.length === 0 && !substituteOnly) return null;

  let confidence = Math.min(99, Math.round(score));
  if (substituteOnly) {
    confidence = Math.min(confidence, 68);
  }
  if (!exactMatch && !aliasMatch && coreOverlapRatio < 0.67) {
    confidence = Math.min(confidence, 74);
  }

  return {
    productId: product.id,
    shopId: product.shopId,
    shopName: product.shopName,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    stock: product.stock,
    image: product.image || product.imageUrl || '',
    rating: product.rating,
    category: product.category,
    unitType: product.unitType,
    packSize: product.packSize,
    distanceKm: Number(product.shopDistance.toFixed(2)),
    confidence,
    recommendedQuantity: estimateRecommendedQuantity(intent, product),
    matchReasons: matchReasons.slice(0, 4),
  };
}

function isSeasoningProductForBaseProteinIntent(intentName: string, product: ProductDoc): boolean {
  const intent = normalizeText(intentName);
  const productName = normalizeText(product.name);
  const productCategory = normalizeText(product.category || '');
  const wantsBaseProtein = ['chicken', 'fish', 'mutton', 'meat'].includes(intent);
  const asksForSeasoning = /\b(masala|spice|powder|paste|mix)\b/.test(intent);
  const productIsSeasoning =
    productCategory.includes('spice') ||
    /\b(masala|spice|powder|paste|mix)\b/.test(productName);
  return wantsBaseProtein && !asksForSeasoning && productIsSeasoning;
}

function choosePreferredShop(preliminary: ProductMatch[][]): string | undefined {
  const counts = new Map<string, number>();
  preliminary.forEach((matches) => {
    const best = matches[0];
    if (best && best.confidence >= 60) {
      counts.set(best.shopId, (counts.get(best.shopId) || 0) + 1);
    }
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function expandIngredientNames(values: string[]): string[] {
  const names = values.filter(Boolean);
  names.forEach((name) => {
    const aliases = LOCAL_ALIASES[normalizeText(name)];
    if (aliases) names.push(...aliases);
  });
  return [...new Set(names)];
}

function isUnitCompatible(intentUnit?: string, unitType?: string, packUnit?: string): boolean {
  if (!intentUnit) return true;
  const normalizedUnit = normalizeText(intentUnit);
  if (!unitType && !packUnit) return true;
  if (['g', 'gram', 'grams', 'kg'].includes(normalizedUnit)) return unitType === 'weight' || ['g', 'kg'].includes(packUnit || '');
  if (['ml', 'l', 'litre', 'liter'].includes(normalizedUnit)) return unitType === 'volume' || ['ml', 'l'].includes(packUnit || '');
  if (['pc', 'pcs', 'piece', 'pieces', 'count'].includes(normalizedUnit)) return unitType === 'count' || ['pcs'].includes(packUnit || '');
  return true;
}

function estimateRecommendedQuantity(intent: IngredientIntent, product: ProductDoc): number {
  const needed = Number(intent.quantity);
  const packQuantity = Number(product.packSize?.quantity);
  const stock = Math.max(1, Number(product.stock || 1));
  if (!Number.isFinite(needed) || needed <= 0 || !Number.isFinite(packQuantity) || packQuantity <= 0) return 1;

  const neededBase = convertToBaseUnit(needed, intent.unit);
  const packBase = convertToBaseUnit(packQuantity, product.packSize?.unit);
  if (!neededBase || !packBase || neededBase.unit !== packBase.unit) return 1;

  return Math.min(stock, Math.max(1, Math.ceil(neededBase.quantity / packBase.quantity)));
}

function convertToBaseUnit(quantity: number, unit?: string): { quantity: number; unit: string } | null {
  const normalizedUnit = normalizeText(unit || '');
  if (['kg', 'kilogram', 'kilograms'].includes(normalizedUnit)) return { quantity: quantity * 1000, unit: 'g' };
  if (['g', 'gram', 'grams', 'gm'].includes(normalizedUnit)) return { quantity, unit: 'g' };
  if (['l', 'litre', 'liter', 'litres', 'liters'].includes(normalizedUnit)) return { quantity: quantity * 1000, unit: 'ml' };
  if (['ml', 'millilitre', 'milliliter'].includes(normalizedUnit)) return { quantity, unit: 'ml' };
  if (['pc', 'pcs', 'piece', 'pieces', 'count'].includes(normalizedUnit)) return { quantity, unit: 'pcs' };
  return null;
}

function toResponseRecipe(recipe: RecipePlan, request: RecipeAssistantRequest) {
  return {
    title: recipe.title,
    servings: recipe.servings || request.servings || 1,
    steps: recipe.steps || [],
    notes: recipe.notes,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

function tokenize(value: string): string[] {
  const tokens = normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  return [...new Set(tokens.map(singularizeToken))];
}

function singularizeToken(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(\d+)\s*(kg|g|gm|ml|l|pcs?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class RequestError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
