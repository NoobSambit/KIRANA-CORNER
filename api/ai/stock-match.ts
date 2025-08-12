import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App | undefined;
function ensureAdmin() {
  if (getApps().length) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (!key) return;
  const serviceAccount = JSON.parse(key);
  app = initializeApp({ credential: cert(serviceAccount) });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { ingredients } = req.body as { ingredients?: string[] };
    if (!ingredients || !Array.isArray(ingredients)) return res.status(400).json({ error: 'Missing ingredients' });
    ensureAdmin();
    if (!app) return res.status(500).json({ error: 'Admin not configured' });
    const db = getFirestore(app);

    const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const ingNorms = ingredients.map(normalize);

    const results: any[] = [];
    const top = await db.collection('products').get();
    results.push(...top.docs.map((d) => ({ id: d.id, ...d.data() })));
    const shops = await db.collection('shops').get();
    for (const s of shops.docs) {
      const cat = await db.collection('shops').doc(s.id).collection('catalog').get();
      results.push(...cat.docs.map((d) => ({ id: d.id, shopId: s.id, shopName: s.get('name'), ...d.data() })));
    }

    const inStock: any[] = [];
    const missing: string[] = [];
    for (const raw of ingredients) {
      const ing = normalize(raw);
      let best: any | undefined;
      for (const p of results) {
        const name = normalize(String(p.name || ''));
        if (name.includes(ing) || ing.includes(name)) { best = p; break; }
        const ingTokens = new Set(ing.split(' '));
        const nameTokens = new Set(name.split(' '));
        const overlap = [...ingTokens].filter((t) => nameTokens.has(t) && t.length > 2);
        if (!best && overlap.length >= 2) best = p;
      }
      if (best) inStock.push({ id: String(best.id), name: String(best.name), price: Number(best.price || 0), image: String(best.image || best.imageUrl || ''), shopId: String(best.shopId || ''), shopName: String(best.shopName || '') });
      else missing.push(raw);
    }

    return res.status(200).json({ inStock, missing });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Stock match failed' });
  }
}


