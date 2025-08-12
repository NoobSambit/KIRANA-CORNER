import { collection, collectionGroup, getDocs, QuerySnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
// @ts-expect-error: JS module without types
import { db } from '../firebase';

export interface MatchedItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  shopId?: string;
  shopName?: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function matchIngredientsToStock(ingredientNames: string[]) {
  try {
    const [topLevelSnap, catalogSnap, productsSnap] = await Promise.all([
      getDocs(collection(db, 'products')).catch(() => ({ docs: [] as QueryDocumentSnapshot<DocumentData>[] } as QuerySnapshot<DocumentData>)),
      getDocs(collectionGroup(db, 'catalog')).catch(() => ({ docs: [] as QueryDocumentSnapshot<DocumentData>[] } as QuerySnapshot<DocumentData>)),
      getDocs(collectionGroup(db, 'products')).catch(() => ({ docs: [] as QueryDocumentSnapshot<DocumentData>[] } as QuerySnapshot<DocumentData>)),
    ]);
    const flatten = (docs: QueryDocumentSnapshot<DocumentData>[]) => docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    type FlatProduct = { id: string; name?: unknown; price?: unknown; image?: unknown; imageUrl?: unknown; shopId?: unknown; shopName?: unknown };
    const products: FlatProduct[] = [...flatten(topLevelSnap.docs || []), ...flatten(catalogSnap.docs || []), ...flatten(productsSnap.docs || [])] as FlatProduct[];

    const inStock: MatchedItem[] = [];
    const missing: string[] = [];

    for (const raw of ingredientNames) {
      const ing = normalize(raw);
      let best: FlatProduct | undefined;
      for (const p of products) {
        const name = normalize(String(p.name || ''));
        if (name.includes(ing) || ing.includes(name)) {
          best = p;
          break;
        }
        // simple token overlap heuristic
        const ingTokens = new Set(ing.split(' '));
        const nameTokens = new Set(name.split(' '));
        const overlap = [...ingTokens].filter((t) => nameTokens.has(t) && t.length > 2);
        if (!best && overlap.length >= 2) best = p;
      }
      if (best) {
        inStock.push({ id: String(best.id || ''), name: String(best.name || ''), price: Number(best.price as number ?? 0), image: String((best.image as string) || (best.imageUrl as string) || ''), shopId: String((best.shopId as string) || ''), shopName: String((best.shopName as string) || '') });
      } else {
        missing.push(raw);
      }
    }

    return { inStock, missing };
  } catch {
    // On failure, mark all as missing
    return { inStock: [], missing: ingredientNames };
  }
}


