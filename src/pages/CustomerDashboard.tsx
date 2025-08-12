/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
// @ts-expect-error: JS module without types
import { getAllShops } from '../utils/shopService';
// @ts-expect-error: JS module without types
import { getNearbyShopProducts } from '../utils/productService';
import { filterShopsByDistance } from '../utils/geoUtils.ts';
// Removed RoleSwitcher card and welcome header
import MapSection from '../components/MapSection';
import FilterBar from '../components/FilterBar';
import ProductGrid from '../components/ProductGrid';
import { useCart } from '../components/CartContext';
import { useSearch } from '../components/SearchContext';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomerDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { searchQuery } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  type LooseRecord = Record<string, unknown>;
  interface MapShop {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    rating: number;
    category: string;
    status: string;
    locationName: string;
    address?: string;
    phone?: string;
    distance?: number;
    openingTime?: string;
    closingTime?: string;
    deliveryAvailable?: boolean;
    imageUrl?: string;
    verified?: boolean;
  }
  const [shops, setShops] = useState<MapShop[]>([]);
  const [nearbyShops, setNearbyShops] = useState<MapShop[]>([]);
  interface Product { id: string; name: string; price: number; originalPrice?: number; image: string; rating: number; shop: string; inStock: boolean; category: string; shopName?: string; shopId?: string }
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // User location (Salt Lake area - more central to shops)
  const userLocation = useMemo(() => ({
    lat: 22.5726,
    lng: 88.3639
  }), []);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Handle category route param ?category=xyz
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, [location.search]);

  // Local banner component that retries multiple asset paths/extensions
  const Banner: React.FC<{ name: string; alt: string; onClick: () => void }> = ({ name, alt, onClick }) => {
    const [srcIdx, setSrcIdx] = useState(0);
    const sources = useMemo(
      () => [
        `/customerdashboard/${name}.jpg`,
        `/customerdashboard/${name}.png`,
        `/dashboard/${name}.jpg`,
        `/dashboard/${name}.png`,
        `/banners/${name}.jpg`,
        `/banners/${name}.png`,
        `/landing/hero-main.png`, // final fallback/placeholder
      ],
      [name]
    );
    const currentSrc = sources[srcIdx] ?? sources[sources.length - 1];
    return (
      <button onClick={onClick} className="group rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-lg h-48 md:h-56 bg-white/5 dark:bg-white/5">
        <img
          src={currentSrc}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform"
          onError={() => setSrcIdx((i) => Math.min(i + 1, sources.length - 1))}
        />
      </button>
    );
  };

  // Load shops from Firestore
  React.useEffect(() => {
    console.log('🔍 Loading shops from Firestore...');
    type DocSnap = { id: string; data: () => Record<string, unknown> };
    type Snap = { docs: DocSnap[] };
    const unsubscribe = getAllShops((snapshot: Snap) => {
      console.log(`📊 Received ${snapshot.docs.length} shops from Firestore`);
      const raw = snapshot.docs.map((doc: DocSnap) => ({ id: doc.id, ...doc.data() })) as LooseRecord[];
      const mapped: MapShop[] = raw
        .filter(s => typeof (s as any).latitude === 'number' && typeof (s as any).longitude === 'number')
        .map(s => ({
          id: String((s as any).id ?? ''),
          name: String((s as any).name ?? 'Shop'),
          latitude: Number((s as any).latitude),
          longitude: Number((s as any).longitude),
          rating: Number((s as any).rating ?? 4.2),
          category: String((s as any).category ?? 'General'),
          status: String((s as any).status ?? 'open'),
          locationName: String((s as any).locationName ?? (s as any).area ?? 'Nearby'),
          address: (s as any).address ? String((s as any).address) : undefined,
          phone: (s as any).phone ? String((s as any).phone) : undefined,
          openingTime: (s as any).openingTime ? String((s as any).openingTime) : undefined,
          closingTime: (s as any).closingTime ? String((s as any).closingTime) : undefined,
          deliveryAvailable: Boolean((s as any).deliveryAvailable ?? true),
          imageUrl: (s as any).imageUrl ? String((s as any).imageUrl) : undefined,
          verified: Boolean((s as any).verified ?? false)
        }));
      console.log('🏪 Shop data:', mapped.slice(0, 2));
      setShops(mapped);

      // Filter nearby shops using geo utils
      const nearby = filterShopsByDistance(mapped as any, userLocation, 3) as unknown as MapShop[];
      setNearbyShops(nearby);
      console.log(`📍 Found ${nearby.length} shops within 3km radius`);
      console.log(`🏪 All shops:`, mapped.length);
      console.log(`🎯 Nearby shops:`, nearby.map(s => `${s.name} (${typeof s.distance === 'number' ? s.distance.toFixed(2) : '—'}km)`).slice(0, 5));
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userLocation]);

  // Load products from nearby shops
  React.useEffect(() => {
    if (nearbyShops.length > 0) {
      console.log('🛒 Loading products from nearby shops...');
      setProductsLoading(true);
      
      const loadProducts = async () => {
        try {
          const nearbyProducts: any[] = await getNearbyShopProducts(shops as any[], userLocation, 3);
          const normalized: Product[] = (nearbyProducts || []).map((p: any) => ({
            id: String(p.id),
            name: String(p.name ?? ''),
            price: Number(p.price ?? 0),
            originalPrice: p.originalPrice !== undefined ? Number(p.originalPrice) : undefined,
            image: String(p.image ?? p.imageUrl ?? ''),
            rating: Number(p.rating ?? 0),
            shop: String(p.shop ?? p.shopName ?? ''),
            inStock: Boolean(p.inStock ?? true),
            category: String(p.category ?? ''),
            shopName: p.shopName,
            shopId: p.shopId
          }));
          setProducts(normalized);
          console.log(`✅ Loaded ${nearbyProducts.length} products from nearby shops`);
        } catch (error) {
          console.error('❌ Error loading nearby products:', error);
        } finally {
          setProductsLoading(false);
        }
      };
      
      loadProducts();
    }
  }, [nearbyShops, shops, userLocation]);

  const popularProducts = [
    {
      id: '1',
      name: 'Basmati Rice Premium 1kg',
      price: 120,
      originalPrice: 140,
      image: 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.5,
      shop: 'Sharma General Store',
      inStock: true,
      category: 'Grocery'
    },
    {
      id: '2',
      name: 'Amul Fresh Milk 1L',
      price: 60,
      image: 'https://images.pexels.com/photos/416656/pexels-photo-416656.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.8,
      shop: 'Fresh Dairy Corner',
      inStock: true,
      category: 'Beverages'
    },
    {
      id: '3',
      name: 'Organic Turmeric Powder 100g',
      price: 45,
      originalPrice: 55,
      image: 'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.6,
      shop: 'Spice Palace',
      inStock: false,
      category: 'Grocery'
    },
    {
      id: '4',
      name: 'Fresh Tomatoes 1kg',
      price: 40,
      image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.2,
      shop: 'Vegetable Corner',
      inStock: true,
      category: 'Grocery'
    },
    {
      id: '5',
      name: 'Coca Cola 500ml',
      price: 25,
      image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.0,
      shop: 'Fresh Dairy Corner',
      inStock: true,
      category: 'Beverages'
    },
    {
      id: '6',
      name: 'Colgate Toothpaste 100g',
      price: 85,
      originalPrice: 95,
      image: 'https://images.pexels.com/photos/298611/pexels-photo-298611.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.4,
      shop: 'Health Plus Store',
      inStock: true,
      category: 'Personal Care'
    }
  ];

  // Add more dummy products for better catalog
  const additionalProducts = [
    {
      id: '7',
      name: 'Tata Tea Premium 1kg',
      price: 180,
      originalPrice: 200,
      image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.3,
      shop: 'Kolkata Kirana Corner',
      inStock: true,
      category: 'Beverages'
    },
    {
      id: '8',
      name: 'Maggi Noodles 2-Minute',
      price: 15,
      image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.1,
      shop: 'Newtown Fresh Mart',
      inStock: true,
      category: 'Grocery'
    },
    {
      id: '9',
      name: 'Britannia Good Day Cookies',
      price: 25,
      image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.2,
      shop: 'Garia Grocery Hub',
      inStock: true,
      category: 'Snacks'
    },
    {
      id: '10',
      name: 'Surf Excel Detergent 1kg',
      price: 120,
      originalPrice: 140,
      image: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.4,
      shop: 'Park Circus Provisions',
      inStock: true,
      category: 'Household'
    },
    {
      id: '11',
      name: 'Parle-G Biscuits 200g',
      price: 20,
      image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.0,
      shop: 'Behala Bazaar',
      inStock: true,
      category: 'Snacks'
    },
    {
      id: '12',
      name: 'Lux Soap 100g',
      price: 35,
      image: 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.3,
      shop: 'Esplanade Essentials',
      inStock: true,
      category: 'Personal Care'
    },
    {
      id: '13',
      name: 'Aashirvaad Atta 5kg',
      price: 250,
      originalPrice: 280,
      image: 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.6,
      shop: 'Dum Dum Dairy',
      inStock: true,
      category: 'Grocery'
    },
    {
      id: '14',
      name: 'Haldiram Namkeen 200g',
      price: 45,
      image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.2,
      shop: 'Salt Lake Spices',
      inStock: true,
      category: 'Snacks'
    },
    {
      id: '15',
      name: 'Vim Dishwash Gel 500ml',
      price: 65,
      image: 'https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.1,
      shop: 'Howrah Station Store',
      inStock: false,
      category: 'Household'
    },
    {
      id: '16',
      name: 'Cadbury Dairy Milk 50g',
      price: 30,
      image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.5,
      shop: 'Newtown Night Store',
      inStock: true,
      category: 'Snacks'
    }
  ];

  const allProducts: Product[] = products.length > 0 ? products : ([...popularProducts, ...additionalProducts] as Product[]);

  const categories = ['Medical Store', 'Kirana', 'Dairy', 'Vegetables', 'Fruits', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Bakery', 'Spices', 'Meat & Fish', 'Sweets', 'Electronics', 'Stationery'];

  // Filter and sort products (defensive checks for incomplete data)
  const filteredProducts = allProducts.filter((product) => {
    if (!product) return false;
    const query = (searchQuery || '').toString().toLowerCase();
    const name = (product.name || '').toString().toLowerCase();
    const shopName = (product.shop || '').toString().toLowerCase();
    const categoryValue = (product.category || '').toString();

    const matchesCategory = selectedCategory === 'all' || categoryValue === selectedCategory;
    const matchesSearch = !query || name.includes(query) || shopName.includes(query) || categoryValue.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (Number(a?.price ?? 0) - Number(b?.price ?? 0));
      case 'price-high':
        return (Number(b?.price ?? 0) - Number(a?.price ?? 0));
      case 'rating':
        return (Number(b?.rating ?? 0) - Number(a?.rating ?? 0));
      case 'popularity':
      default:
        return (Number(b?.rating ?? 0) - Number(a?.rating ?? 0)); // Default to rating for popularity
    }
  });

  const { addToCart } = useCart();

  const handleAddToCart = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (product && product.inStock) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        shop: product.shop || product.shopName,
        shopId: product.shopId || undefined,
        shopName: product.shopName || product.shop || undefined,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banners Grid 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Banner name="kirana" alt="Kirana" onClick={() => navigate(`/dashboard?category=Kirana`)} />
          <Banner name="household" alt="Household" onClick={() => navigate(`/dashboard?category=Household`)} />
          <Banner name="electronics" alt="Electronics" onClick={() => navigate(`/dashboard?category=Electronics`)} />
          <Banner name="snack" alt="Snacks" onClick={() => navigate(`/dashboard?category=Snacks`)} />
        </div>

        <div className="space-y-8">
          {/* Map Section */}
          {loading ? (
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 dark:border-white/10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-300 mt-4 text-center">Loading shops...</p>
            </div>
          ) : (
            <MapSection shops={nearbyShops as any[]} allShops={shops as any[]} userLocation={userLocation} />
          )}

          {/* Filter Bar */}
          <FilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Product Grid */}
          {productsLoading ? (
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 dark:border-white/10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-300 mt-4 text-center">Loading products from nearby shops...</p>
            </div>
          ) : (
            <ProductGrid
              products={sortedProducts}
              viewMode={viewMode}
              onAddToCart={handleAddToCart}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;