/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useCallback } from 'react';
// @ts-expect-error: JS module
import { getAllShops } from '../utils/shopService';
// @ts-expect-error: JS module
import { getNearbyShopProducts } from '../utils/productService';
import { filterShopsByDistance } from '../utils/geoUtils.ts';
import MapSection from '../components/MapSection';
import FilterBar from '../components/FilterBar';
import ProductGrid from '../components/ProductGrid';
import RecipeAssistant from '../components/RecipeAssistant';
import { useCart } from '../components/CartContext';
import { useSearch } from '../components/SearchContext';
import { resolveProductImage } from '../utils/productImages';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, MapPin, ChevronDown, ChevronUp, ChefHat,
  ShoppingBag, Leaf, Milk, Candy, Coffee, Droplets,
  Tv, Utensils, Fish, HeartPulse, BookOpen,
  FlaskConical, Sparkles, Apple,
} from 'lucide-react';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'Kirana',        label: 'Kirana',       Icon: ShoppingBag,  color: '#F97316' },
  { id: 'Dairy',         label: 'Dairy',         Icon: Milk,         color: '#3B82F6' },
  { id: 'Snacks',        label: 'Snacks',         Icon: Candy,        color: '#EAB308' },
  { id: 'Beverages',     label: 'Beverages',      Icon: Coffee,       color: '#D97706' },
  { id: 'Vegetables',    label: 'Vegetables',     Icon: Leaf,         color: '#16A34A' },
  { id: 'Fruits',        label: 'Fruits',         Icon: Apple,        color: '#DC2626' },
  { id: 'Personal Care', label: 'Care',           Icon: Droplets,     color: '#EC4899' },
  { id: 'Household',     label: 'Household',      Icon: Utensils,     color: '#8B5CF6' },
  { id: 'Bakery',        label: 'Bakery',         Icon: FlaskConical, color: '#F43F5E' },
  { id: 'Spices',        label: 'Spices',         Icon: Sparkles,     color: '#EA580C' },
  { id: 'Meat & Fish',   label: 'Meat',           Icon: Fish,         color: '#0891B2' },
  { id: 'Medical Store', label: 'Medical',        Icon: HeartPulse,   color: '#059669' },
  { id: 'Electronics',   label: 'Electronics',    Icon: Tv,           color: '#4F46E5' },
  { id: 'Stationery',    label: 'Stationery',     Icon: BookOpen,     color: '#0D9488' },
];

const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const PRODUCTS_PER_PAGE = 12; // Show 12 at a time

// ─── Demo fallback products ───────────────────────────────────────────────────
const DEMO_PRODUCTS = [
  { id: '1',  name: 'Basmati Rice Premium 1kg',   price: 120, originalPrice: 140, image: 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400',  rating: 4.5, shop: 'Sharma General Store',   inStock: true,  category: 'Kirana',       shopDistance: 0.8 },
  { id: '2',  name: 'Amul Fresh Milk 1L',          price: 60,                      image: 'https://images.pexels.com/photos/416656/pexels-photo-416656.jpeg?auto=compress&cs=tinysrgb&w=400',  rating: 4.8, shop: 'Fresh Dairy Corner',    inStock: true,  category: 'Dairy',        shopDistance: 1.2 },
  { id: '3',  name: 'Organic Turmeric 100g',       price: 45, originalPrice: 55,  image: 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.6, shop: 'Spice Palace',          inStock: false, category: 'Spices',       shopDistance: 2.1 },
  { id: '4',  name: 'Fresh Tomatoes 1kg',          price: 40,                      image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',  rating: 4.2, shop: 'Vegetable Corner',      inStock: true,  category: 'Vegetables',   shopDistance: 0.6 },
  { id: '5',  name: 'Coca Cola 500ml',             price: 25,                      image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.0, shop: 'Beverages Hub', inStock: true, category: 'Beverages', shopDistance: 1.5 },
  { id: '6',  name: 'Colgate Toothpaste 100g',     price: 85, originalPrice: 95,  image: 'https://images.pexels.com/photos/298611/pexels-photo-298611.jpeg?auto=compress&cs=tinysrgb&w=400',  rating: 4.4, shop: 'Health Plus Store',     inStock: true,  category: 'Personal Care',shopDistance: 1.8 },
  { id: '7',  name: 'Tata Tea Premium 1kg',        price: 180, originalPrice: 200, image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.3, shop: 'Kolkata Kirana Corner', inStock: true,  category: 'Beverages',    shopDistance: 2.4 },
  { id: '8',  name: 'Maggi Noodles 2-Minute',      price: 15,                      image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.1, shop: 'Newtown Fresh Mart',    inStock: true,  category: 'Snacks',       shopDistance: 3.0 },
  { id: '9',  name: 'Britannia Good Day Cookies',  price: 25,                      image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400',  rating: 4.2, shop: 'Garia Grocery Hub',     inStock: true,  category: 'Snacks',       shopDistance: 3.2 },
  { id: '10', name: 'Surf Excel Detergent 1kg',    price: 120, originalPrice: 140, image: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.4, shop: 'Park Circus Provisions', inStock: true, category: 'Household',    shopDistance: 4.1 },
  { id: '11', name: 'Parle-G Biscuits 200g',       price: 20,                      image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400',  rating: 4.0, shop: 'Behala Bazaar',         inStock: true,  category: 'Snacks',       shopDistance: 4.5 },
  { id: '12', name: 'Lux Soap 100g',               price: 35,                      image: 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.3, shop: 'Esplanade Essentials',  inStock: true,  category: 'Personal Care',shopDistance: 4.8 },
  { id: '13', name: 'Aashirvaad Atta 5kg',         price: 250, originalPrice: 280, image: 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400',   rating: 4.6, shop: 'Dum Dum Dairy',         inStock: true,  category: 'Kirana',       shopDistance: 1.1 },
  { id: '14', name: 'Haldiram Namkeen 200g',       price: 45,                      image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.2, shop: 'Salt Lake Spices',      inStock: true,  category: 'Snacks',       shopDistance: 0.9 },
  { id: '15', name: 'Cadbury Dairy Milk 50g',      price: 30,                      image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.5, shop: 'Newtown Night Store', inStock: true, category: 'Snacks', shopDistance: 2.8 },
  { id: '16', name: 'Vim Dishwash Gel 500ml',      price: 65,                      image: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=400', rating: 4.1, shop: 'Howrah Station Store',  inStock: false, category: 'Household',    shopDistance: 4.9 },
];

// ─── Component ────────────────────────────────────────────────────────────────
const CustomerDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { searchQuery } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);

  type MapShop = {
    id: string; name: string; latitude: number; longitude: number; rating: number;
    category: string; status: string; locationName: string; address?: string;
    phone?: string; distance?: number; openingTime?: string; closingTime?: string;
    deliveryAvailable?: boolean; imageUrl?: string; verified?: boolean;
  };
  type Product = {
    id: string; name: string; price: number; originalPrice?: number; image: string;
    rating: number; shop: string; inStock: boolean; category: string;
    shopName?: string; shopId?: string; stock?: number; shopDistance?: number;
    imageUrl?: string; canonicalName?: string; normalizedName?: string; subcategory?: string;
    ingredientIds?: string[]; aliases?: string[];
  };

  const [shops, setShops] = useState<MapShop[]>([]);
  const [nearbyShops, setNearbyShops] = useState<MapShop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const userLocation = useMemo(() => ({ lat: 22.5726, lng: 88.3639 }), []);
  const nearbyRadiusKm = 5;

  const location = useLocation();
  const navigate = useNavigate();

  // Sync category from URL
  React.useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category');
    if (cat) { setSelectedCategory(cat); setVisibleCount(PRODUCTS_PER_PAGE); }
  }, [location.search]);

  // Load shops
  React.useEffect(() => {
    type DocSnap = { id: string; data: () => Record<string, unknown> };
    const unsub = getAllShops((snap: { docs: DocSnap[] }) => {
      const raw = snap.docs.map((d: DocSnap) => ({ id: d.id, ...d.data() }));
      const mapped: MapShop[] = raw
        .filter((s: any) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
        .map((s: any) => ({
          id: String(s.id ?? ''),
          name: String(s.name ?? 'Shop'),
          latitude: Number(s.latitude),
          longitude: Number(s.longitude),
          rating: Number(s.rating ?? 4.2),
          category: String(s.category ?? 'General'),
          status: String(s.status ?? 'open'),
          locationName: String(s.locationName ?? s.area ?? 'Nearby'),
          address: s.address ? String(s.address) : undefined,
          phone: s.phone ? String(s.phone) : undefined,
          openingTime: s.openingTime ? String(s.openingTime) : undefined,
          closingTime: s.closingTime ? String(s.closingTime) : undefined,
          deliveryAvailable: Boolean(s.deliveryAvailable ?? true),
          imageUrl: s.imageUrl ? String(s.imageUrl) : undefined,
          verified: Boolean(s.verified ?? false),
        }));
      setShops(mapped);
      setNearbyShops(filterShopsByDistance(mapped as any, userLocation, nearbyRadiusKm) as unknown as MapShop[]);
      setLoading(false);
    });
    return () => unsub();
  }, [userLocation]);

  // Load products (limit query to 50 products)
  React.useEffect(() => {
    if (nearbyShops.length > 0) {
      setProductsLoading(true);
      const load = async () => {
        try {
          const raw: any[] = await getNearbyShopProducts(shops as any[], userLocation, nearbyRadiusKm);
          // Deduplicate by id and limit to 50 for performance
          const seen = new Set<string>();
          const normalized: Product[] = [];
          for (const p of (raw || [])) {
            if (seen.has(String(p.id))) continue;
            seen.add(String(p.id));
            const product = {
              id: String(p.id),
              name: String(p.name ?? ''),
              price: Number(p.price ?? 0),
              originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
              image: String(p.image ?? p.imageUrl ?? ''),
              imageUrl: p.imageUrl ? String(p.imageUrl) : undefined,
              rating: Number(p.rating ?? 0),
              shop: String(p.shop ?? p.shopName ?? ''),
              inStock: Boolean(p.inStock ?? true),
              category: String(p.category ?? ''),
              subcategory: p.subcategory ? String(p.subcategory) : undefined,
              canonicalName: p.canonicalName ? String(p.canonicalName) : undefined,
              normalizedName: p.normalizedName ? String(p.normalizedName) : undefined,
              ingredientIds: Array.isArray(p.ingredientIds) ? p.ingredientIds.map(String) : undefined,
              aliases: Array.isArray(p.aliases) ? p.aliases.map(String) : undefined,
              shopName: p.shopName,
              shopId: p.shopId,
              stock: p.stock != null ? Number(p.stock) : undefined,
              shopDistance: p.shopDistance != null ? Number(p.shopDistance) : undefined,
            };
            normalized.push({ ...product, image: resolveProductImage(product) });
            if (normalized.length >= 80) break; // Hard cap
          }
          setProducts(normalized);
        } catch (e) {
          console.error('Error loading nearby products:', e);
        } finally {
          setProductsLoading(false);
        }
      };
      load();
    }
  }, [nearbyShops, shops, userLocation]);

  const allProducts = products.length > 0 ? products : DEMO_PRODUCTS;

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return allProducts.filter((p) => {
      const matchCat  = selectedCategory === 'all' || p.category === selectedCategory;
      const matchQ    = !q || p.name.toLowerCase().includes(q) || p.shop.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':  return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating':     return b.rating - a.rating;
        default:           return (a.shopDistance ?? 99) - (b.shopDistance ?? 99); // sort by distance by default
      }
    });
  }, [filteredProducts, sortBy]);

  // Paginated slice
  const visibleProducts = useMemo(() => sortedProducts.slice(0, visibleCount), [sortedProducts, visibleCount]);
  const hasMore = visibleCount < sortedProducts.length;
  const remaining = sortedProducts.length - visibleCount;

  const { addToCart } = useCart();
  const handleAddToCart = useCallback((productId: string) => {
    const p = allProducts.find((x) => x.id === productId);
    if (p?.inStock) {
      addToCart({
        id: p.id, name: p.name, price: p.price, image: resolveProductImage(p), quantity: 1,
        shop: p.shop, shopId: p.shopId, shopName: p.shopName || p.shop,
      });
    }
  }, [allProducts, addToCart]);

  // Reset pagination when filter changes
  React.useEffect(() => { setVisibleCount(PRODUCTS_PER_PAGE); }, [selectedCategory, sortBy, searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-4">

        {/* ── Delivery promise bar ── */}
        <div className="flex items-center justify-between qc-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--pastel-mint)' }}>
              <Zap className="h-4 w-4" style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-[13px] font-extrabold" style={{ color: 'var(--text-primary)' }}>Delivery in ~15 min</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>From stores near you</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} />
            <span className="hidden sm:inline">Salt Lake, Kolkata</span>
            <span className="sm:hidden">Nearby</span>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* ── Category rail — premium pill buttons ── */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Categories</h2>
            {selectedCategory !== 'all' && (
              <button className="section-link text-[12px]" onClick={() => { setSelectedCategory('all'); navigate('/dashboard'); }}>
                Clear ×
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, Icon, color }) => {
              const isActive = selectedCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    const next = isActive ? 'all' : id;
                    setSelectedCategory(next);
                    navigate(`/dashboard${isActive ? '' : `?category=${encodeURIComponent(id)}`}`);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 tap-transparent whitespace-nowrap"
                  style={{
                    flex: '1 1 0%',
                    minWidth: '120px',
                    background: isActive ? color : 'var(--bg-card)',
                    border: `1px solid ${isActive ? color : 'var(--border)'}`,
                    boxShadow: isActive ? `0 2px 10px ${color}40` : 'var(--shadow-card)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : `${color}18`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: isActive ? '#fff' : color }} />
                  </div>
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: isActive ? '#fff' : 'var(--text-primary)' }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Recipe Assistant collapsed card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--pastel-peach), var(--pastel-amber))',
            border: '1px solid var(--border-brand)',
          }}
        >
          <button
            onClick={() => setRecipeOpen(!recipeOpen)}
            className="w-full flex items-center justify-between px-4 py-3.5 tap-transparent"
            aria-expanded={recipeOpen}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: 'var(--brand)' }}>
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-extrabold" style={{ color: 'var(--text-primary)' }}>Recipe Assistant</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Tell me what you&apos;re cooking — I&apos;ll find the ingredients
                </p>
              </div>
            </div>
            {recipeOpen
              ? <ChevronUp className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              : <ChevronDown className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            }
          </button>
          {recipeOpen && (
            <div style={{ borderTop: '1px solid var(--border-brand)', background: 'var(--bg-card)' }}>
              <RecipeAssistant userLocation={userLocation} radiusKm={nearbyRadiusKm} />
            </div>
          )}
        </div>

        {/* ── Filter bar ── */}
        <FilterBar
          categories={ALL_CATEGORY_IDS}
          selectedCategory={selectedCategory}
          onCategoryChange={(cat) => { setSelectedCategory(cat); setVisibleCount(PRODUCTS_PER_PAGE); }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* ── Map — above products ── */}
        {!loading && (
          <MapSection shops={nearbyShops as any[]} allShops={shops as any[]} userLocation={userLocation} />
        )}
        {loading && (
          <div className="qc-card px-4 py-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 mb-2" style={{ borderColor: 'var(--brand)' }} />
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>Locating nearby shops…</p>
          </div>
        )}

        {/* ── Product grid ── */}
        <div>
          <div className="section-header mb-4">
            <h2 className="section-title">Products Near You</h2>
            <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {sortedProducts.length} items
            </span>
          </div>

          <ProductGrid
            products={visibleProducts}
            viewMode={viewMode}
            onAddToCart={handleAddToCart}
            loading={productsLoading}
          />

          {/* Load more */}
          {!productsLoading && hasMore && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={() => setVisibleCount((n) => n + PRODUCTS_PER_PAGE)}
                className="btn-primary px-8 py-3"
              >
                Load {Math.min(remaining, PRODUCTS_PER_PAGE)} more products
              </button>
              <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Showing {visibleCount} of {sortedProducts.length} products
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;
