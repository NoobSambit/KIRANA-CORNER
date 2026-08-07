/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Apple,
  ChevronDown,
  ChevronRight,
  Coffee,
  Grid2X2,
  Leaf,
  List,
  Milk,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
// @ts-expect-error: JS module
import { getAllShops } from '../utils/shopService';
// @ts-expect-error: JS module
import { getNearbyShopProducts } from '../utils/productService';
import { filterShopsByDistance } from '../utils/geoUtils.ts';
import MapSection from '../components/MapSection';
import ProductGrid from '../components/ProductGrid';
import RecipeAssistant from '../components/RecipeAssistant';
import { useCart } from '../components/CartContext';
import { useSearch } from '../components/SearchContext';
import { useTheme } from '../components/ThemeContext';

const STORE_THUMBNAIL = '/images/stores/kirana-storefront.png';
const DEFAULT_LOCATION = { lat: 22.5893, lng: 88.4096 };
const DELIVERY_RADIUS_KM = 3;
const PRODUCTS_PER_SECTION = 8;

type DashboardShop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  category: string;
  status: string;
  locationName: string;
  address?: string;
  imageUrl?: string;
  deliveryAvailable?: boolean;
  verified?: boolean;
  distance?: number;
};

type DashboardProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  shop: string;
  shopId?: string;
  shopName?: string;
  shopDistance?: number;
  shopImage?: string;
  inStock: boolean;
  stock?: number;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  canonicalName?: string;
  normalizedName?: string;
  ingredientIds?: string[];
  aliases?: string[];
};

type CategoryDefinition = {
  id: string;
  label: string;
  Icon: LucideIcon;
  color: string;
};

const CATEGORIES: CategoryDefinition[] = [
  { id: 'Kirana', label: 'Kirana', Icon: ShoppingBag, color: '#c98a41' },
  { id: 'Dairy', label: 'Dairy', Icon: Milk, color: '#4d91cf' },
  { id: 'Snacks', label: 'Snacks', Icon: Package, color: '#b16b96' },
  { id: 'Beverages', label: 'Beverages', Icon: Coffee, color: '#439c84' },
  { id: 'Vegetables', label: 'Vegetables', Icon: Leaf, color: '#73a34e' },
  { id: 'Fruits', label: 'Fruits', Icon: Apple, color: '#b9534d' },
  { id: 'Meat & Fish', label: 'Meat & Fish', Icon: Waves, color: '#a96358' },
  { id: 'Household', label: 'Household', Icon: Utensils, color: '#8b76b8' },
];

const FILTER_CATEGORIES = ['Kirana', 'Dairy', 'Snacks', 'Vegetables', 'Fruits', 'Meat & Fish', 'Household'];

const formatDistance = (distance?: number) => {
  if (distance === undefined) return 'Nearby';
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
};

const safeImage = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const CustomerDashboard: React.FC = () => {
  const { searchQuery } = useSearch();
  const { cart, addToCart } = useCart();
  const { isDark, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('nearest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipePrompt, setRecipePrompt] = useState('');
  const [shops, setShops] = useState<DashboardShop[]>([]);
  const [nearbyShops, setNearbyShops] = useState<DashboardShop[]>([]);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [shopLoadError, setShopLoadError] = useState<string | null>(null);

  const userLocation = useMemo(() => DEFAULT_LOCATION, []);

  useEffect(() => {
    try {
      if (localStorage.getItem('kirana-theme') !== 'light') setTheme('dark');
    } catch {
      setTheme('dark');
    }
  }, [setTheme]);

  useEffect(() => {
    const category = new URLSearchParams(location.search).get('category');
    setSelectedCategory(category || 'all');
  }, [location.search]);

  useEffect(() => {
    let active = true;
    setShopsLoading(true);
    setShopLoadError(null);

    try {
      const unsubscribe = getAllShops((snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => {
        if (!active) return;
        const mapped = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: String(data.name || 'Local store'),
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              rating: Number(data.rating || 0),
              category: String(data.category || 'Kirana'),
              status: String(data.status || 'open'),
              locationName: String(data.locationName || 'Salt Lake'),
              address: safeImage(data.address) || undefined,
              imageUrl: safeImage(data.imageUrl) || undefined,
              deliveryAvailable: Boolean(data.deliveryAvailable ?? true),
              verified: Boolean(data.verified ?? false),
            } satisfies DashboardShop;
          })
          .filter((shop) => Number.isFinite(shop.latitude) && Number.isFinite(shop.longitude));

        const nearby = filterShopsByDistance(mapped as any[], userLocation, DELIVERY_RADIUS_KM) as DashboardShop[];
        setShops(mapped);
        setNearbyShops(nearby);
        setShopsLoading(false);
      });

      return () => {
        active = false;
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (error) {
      console.error('Unable to subscribe to nearby stores:', error);
      setShopLoadError('Nearby store data is unavailable right now.');
      setShopsLoading(false);
      setProductsLoading(false);
      return () => { active = false; };
    }
  }, [userLocation]);

  useEffect(() => {
    let active = true;
    if (nearbyShops.length === 0) {
      setProducts([]);
      setProductsLoading(false);
      return () => { active = false; };
    }

    setProductsLoading(true);
    getNearbyShopProducts(nearbyShops as any[], userLocation, DELIVERY_RADIUS_KM)
      .then((rawProducts: any[]) => {
        if (!active) return;
        const shopById = new Map(nearbyShops.map((shop) => [shop.id, shop]));
        const seen = new Set<string>();
        const normalized = (rawProducts || []).reduce<DashboardProduct[]>((result, raw) => {
          const id = String(raw.id || '');
          if (!id || seen.has(id)) return result;
          seen.add(id);
          const shop = shopById.get(String(raw.shopId));
          result.push({
            id,
            name: String(raw.name || 'Unnamed product'),
            price: Number(raw.price || 0),
            originalPrice: raw.originalPrice == null ? undefined : Number(raw.originalPrice),
            image: safeImage(raw.image || raw.imageUrl),
            imageUrl: safeImage(raw.imageUrl) || undefined,
            rating: Number(raw.rating || 0),
            shop: String(raw.shopName || shop?.name || 'Local store'),
            shopName: String(raw.shopName || shop?.name || 'Local store'),
            shopId: String(raw.shopId || shop?.id || ''),
            shopImage: shop?.imageUrl || STORE_THUMBNAIL,
            shopDistance: raw.shopDistance == null ? shop?.distance : Number(raw.shopDistance),
            inStock: Boolean(raw.inStock ?? Number(raw.stock || 0) > 0),
            stock: raw.stock == null ? undefined : Number(raw.stock),
            category: String(raw.category || 'Kirana'),
            subcategory: safeImage(raw.subcategory) || undefined,
            canonicalName: safeImage(raw.canonicalName) || undefined,
            normalizedName: safeImage(raw.normalizedName) || undefined,
            ingredientIds: Array.isArray(raw.ingredientIds) ? raw.ingredientIds.map(String) : undefined,
            aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : undefined,
          });
          return result;
        }, []);
        setProducts(normalized);
      })
      .catch((error) => {
        console.error('Unable to load nearby products:', error);
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => { active = false; };
  }, [nearbyShops, userLocation]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = !query || [product.name, product.shop, product.category, product.subcategory]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const sortedProducts = useMemo(() => [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (a.shopDistance ?? 99) - (b.shopDistance ?? 99);
  }), [filteredProducts, sortBy]);

  const visibleProducts = sortedProducts.slice(0, PRODUCTS_PER_SECTION);
  const kitchenProducts = useMemo(() => {
    const visibleIds = new Set(visibleProducts.map((product) => product.id));
    return products.filter((product) => !visibleIds.has(product.id)).slice(0, PRODUCTS_PER_SECTION);
  }, [products, visibleProducts]);

  const storeProductCounts = useMemo(() => products.reduce<Record<string, number>>((counts, product) => {
    if (product.shopId) counts[product.shopId] = (counts[product.shopId] || 0) + 1;
    return counts;
  }, {}), [products]);

  const featuredStores = useMemo(() => [...nearbyShops]
    .sort((a, b) => (storeProductCounts[b.id] || 0) - (storeProductCounts[a.id] || 0))
    .slice(0, 3), [nearbyShops, storeProductCounts]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    navigate(category === 'all' ? '/dashboard' : `/dashboard?category=${encodeURIComponent(category)}`);
  };

  const handleAddToCart = useCallback((productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product || !product.inStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      quantity: 1,
      shop: product.shop,
      shopId: product.shopId,
      shopName: product.shopName || product.shop,
    });
  }, [addToCart, products]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className={`marketplace-surface ${isDark ? 'marketplace-dark' : 'marketplace-light'} min-h-screen pb-24 text-[var(--text-primary)]`}>
      <div className="mx-auto w-full max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_420px]"
        >
          <div className="max-w-[780px]">
            <p className="marketplace-kicker mb-3">Shopping locally</p>
            <h1 className="max-w-[740px] text-[clamp(2rem,3.4vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.045em] text-[#f3f5f4]">
              Everything nearby, delivered from stores you know.
            </h1>
            <p className="mt-3 text-[14px] text-[#8e9b9a]">
              {shopsLoading ? 'Locating verified neighbourhood stores around Salt Lake…' : `${nearbyShops.length} verified neighbourhood ${nearbyShops.length === 1 ? 'store' : 'stores'} around Salt Lake`}
            </p>
          </div>

          <div className="marketplace-panel relative overflow-hidden rounded-[18px] px-5 py-4">
            <div className="absolute -right-2 -top-5 text-[120px] leading-none text-[#1a282b]" aria-hidden="true">⌖</div>
            <div className="relative">
              <p className="text-[13px] font-medium text-[#8c9998]">Delivering to</p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-[21px] font-bold text-[#f1f5f4]">Salt Lake, Kolkata</p>
                <ChevronDown className="h-4 w-4 text-[#93a09e]" />
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#2fcf75]">Nearby stores · 15–35 min</p>
            </div>
          </div>
        </motion.section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="marketplace-section-title">Shop by category</h2>
            {selectedCategory !== 'all' && (
              <button type="button" onClick={() => handleCategoryChange('all')} className="text-[12px] font-bold text-[#ff8b32]">Clear filter</button>
            )}
          </div>
          <div className="marketplace-scroll-rail flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map(({ id, label, Icon, color }) => {
              const active = selectedCategory === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => handleCategoryChange(active ? 'all' : id)}
                  className={`group flex min-w-[140px] flex-1 flex-col items-center gap-3 rounded-[16px] border px-3 py-3.5 transition-all sm:min-w-[150px] ${active ? 'border-[#ed731c] bg-[#22180f]' : 'border-[#283537] bg-[#111a1c] hover:border-[#557073]'}`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border" style={{ backgroundColor: `${color}22`, borderColor: `${color}85` }}>
                    <Icon className="h-8 w-8" style={{ color }} strokeWidth={1.45} />
                  </span>
                  <span className={`text-[14px] font-semibold ${active ? 'text-[#ff861f]' : 'text-[#e3e9e8]'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-[#754116] bg-[linear-gradient(100deg,#26160c,#171817_60%)]">
          <div className="grid gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.2fr)_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#ff932f] bg-[#26170b] text-[#ff992f] shadow-[0_0_24px_rgba(255,119,24,0.22)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#f2f3ee]">Recipe Assistant</h2>
                <p className="mt-1 text-[13px] leading-snug text-[#a89582]">Tell us what you want to cook.<br className="hidden sm:block" /> We&apos;ll find the ingredients from nearby stores.</p>
              </div>
            </div>
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                if (recipePrompt.trim()) setRecipeOpen(true);
              }}
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78695b]" />
              <input
                value={recipePrompt}
                onChange={(event) => setRecipePrompt(event.target.value)}
                placeholder="e.g. Butter chicken for 4 people"
                className="h-14 w-full rounded-[12px] border border-[#57442e] bg-[#121819] pl-11 pr-12 text-[14px] text-[#edf1ee] outline-none placeholder:text-[#786f66] focus:border-[#e17b25]"
              />
              <Sparkles className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f6b12d]" />
            </form>
            <button type="button" onClick={() => setRecipeOpen(true)} className="h-14 rounded-[12px] bg-[#ff7718] px-7 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(255,119,24,0.24)] transition hover:bg-[#ff8a32]">
              Find ingredients
            </button>
          </div>
          <AnimatePresence initial={false}>
            {recipeOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#754116] bg-[#101719]">
                <RecipeAssistant userLocation={userLocation} radiusKm={DELIVERY_RADIUS_KM} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="marketplace-muted-panel overflow-hidden rounded-[16px]">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 lg:flex-nowrap">
            <div className="mr-2 flex items-center gap-2 whitespace-nowrap text-[13px] font-bold text-[#f0f4f2]">
              <span>Nearby discovery</span>
            </div>
            <div className="marketplace-scroll-rail flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {['all', ...FILTER_CATEGORIES].map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`whitespace-nowrap rounded-[9px] border px-4 py-2 text-[12px] font-semibold transition ${selectedCategory === category ? 'border-[#f27b23] bg-[#2b1d12] text-[#ff8c33]' : 'border-[#2b3a3c] bg-[#141d1f] text-[#9eaaa8] hover:border-[#647675]'}`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
            <label className="relative flex shrink-0 items-center">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 appearance-none rounded-[9px] border border-[#2b3a3c] bg-[#141d1f] pl-3 pr-9 text-[12px] font-semibold text-[#b5c0bd] outline-none">
                <option value="nearest">Nearest</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#7e8a89]" />
            </label>
            <div className="hidden items-center overflow-hidden rounded-[9px] border border-[#2b3a3c] bg-[#141d1f] sm:flex">
              <button type="button" onClick={() => setViewMode('grid')} className={`flex h-10 w-10 items-center justify-center ${viewMode === 'grid' ? 'bg-[#2a1c11] text-[#ff8b32]' : 'text-[#7c8988]'}`} aria-label="Grid view"><Grid2X2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setViewMode('list')} className={`flex h-10 w-10 items-center justify-center ${viewMode === 'list' ? 'bg-[#2a1c11] text-[#ff8b32]' : 'text-[#7c8988]'}`} aria-label="List view"><List className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <section id="catalog">
          {shopsLoading ? (
            <div className="marketplace-panel flex h-[310px] items-center justify-center rounded-[18px] text-[13px] text-[#8d9998]">Locating shops near you…</div>
          ) : (
            <MapSection shops={nearbyShops as any[]} allShops={shops as any[]} userLocation={userLocation} />
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="marketplace-section-title">Products near you</h2>
              <p className="mt-1 text-[12px] text-[#82908f]">Available right now from neighbourhood stores around you</p>
              <p className="mt-2 text-[12px] text-[#82908f]">Based on <span className="font-semibold text-[#ff8624]">Salt Lake, Kolkata</span> · within {DELIVERY_RADIUS_KM} km</p>
            </div>
            <button type="button" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} className="hidden items-center gap-1 text-[12px] font-bold text-[#ff8624] sm:flex">View all <ChevronRight className="h-4 w-4" /></button>
          </div>
          {shopLoadError && <p className="mb-3 text-[12px] text-[#e68b72]">{shopLoadError}</p>}
          <ProductGrid products={visibleProducts} viewMode={viewMode} onAddToCart={handleAddToCart} loading={productsLoading} />
          {!productsLoading && sortedProducts.length > PRODUCTS_PER_SECTION && (
            <button type="button" onClick={() => setViewMode('list')} className="mx-auto mt-5 flex items-center gap-1 rounded-[10px] border border-[#4b5d5d] px-4 py-2 text-[12px] font-bold text-[#c1cdca] transition hover:border-[#ff7718] hover:text-[#ff8b32]">Show more products <ChevronDown className="h-4 w-4" /></button>
          )}
        </section>

        {featuredStores.length > 0 && (
          <section id="nearby-stores">
            <div className="mb-3">
              <h2 className="marketplace-section-title">Popular from nearby stores</h2>
              <p className="mt-1 text-[12px] text-[#82908f]">Top rated neighbourhood stores loved by customers like you</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {featuredStores.map((shop) => (
                <article key={shop.id} className="marketplace-panel flex items-center gap-3 rounded-[14px] p-3">
                  <img src={shop.imageUrl || STORE_THUMBNAIL} alt="" className="h-[82px] w-[104px] shrink-0 rounded-[9px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-[15px] font-bold text-[#e8eeec]">{shop.name}</h3>
                      {shop.verified && <span className="text-[12px] text-[#31c877]">●</span>}
                    </div>
                    <p className="mt-1 text-[11px] text-[#9ca9a7]">{formatDistance(shop.distance)} · <span className="text-[#f5af34]">★ {shop.rating.toFixed(1)}</span></p>
                    <p className="mt-1 text-[11px] text-[#9ca9a7]">Delivery {shop.status === 'open' ? '20–30 min' : 'later'} · {storeProductCounts[shop.id] || 0} products</p>
                    <button type="button" onClick={() => navigate(`/shop/${shop.id}`)} className="mt-2 text-[11px] font-bold text-[#ff8b32]">Shop store <ChevronRight className="inline h-3 w-3" /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {kitchenProducts.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="marketplace-section-title">For your kitchen</h2>
              <p className="mt-1 text-[12px] text-[#82908f]">More essentials from the stores near you</p>
            </div>
            <ProductGrid products={kitchenProducts} viewMode={viewMode} onAddToCart={handleAddToCart} />
          </section>
        )}

        {!productsLoading && products.length === 0 && (
          <div className="marketplace-panel flex flex-col items-center justify-center rounded-[18px] px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1b2b2c] text-[#ff8b32]"><Store className="h-7 w-7" /></div>
            <h2 className="text-[18px] font-bold text-[#f0f4f2]">No live products in this area yet</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#82908f]">The catalog is connected to nearby store inventory. Once a local shop publishes stock within {DELIVERY_RADIUS_KM} km, it will appear here.</p>
          </div>
        )}
      </div>

      {totalItems > 0 && (
        <button type="button" onClick={() => document.querySelector<HTMLButtonElement>('[aria-label^="Open cart"]')?.click()} className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-[14px] border border-[#a85b18] bg-[#171d1c] px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition hover:border-[#ff8624] sm:right-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff7718] text-white"><ShoppingBag className="h-4 w-4" /></span>
          <span className="text-left"><span className="block text-[12px] font-bold text-[#e8eeec]">{totalItems} item{totalItems === 1 ? '' : 's'} · ₹{cartTotal}</span><span className="mt-0.5 block text-[12px] font-bold text-[#ff8b32]">View cart <ChevronRight className="inline h-3.5 w-3.5" /></span></span>
        </button>
      )}
    </div>
  );
};

export default CustomerDashboard;
