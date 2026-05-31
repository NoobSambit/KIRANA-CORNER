import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Plus, Minus } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
// @ts-expect-error: JS module without TS types
import { db } from '../firebase';
// @ts-expect-error: JS module without TS types
import { getShopById } from '../utils/shopService';
import { useCart } from '../components/CartContext';
import { ProductCardSkeleton } from '../components/ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  imageUrl?: string;
  canonicalName?: string;
  normalizedName?: string;
  subcategory?: string;
  ingredientIds?: string[];
  aliases?: string[];
  inStock: boolean;
  category: string;
  shopId: string;
  shopName: string;
}

const fallbackImg = (name: string) => {
  const label = (name || 'P').slice(0, 2).toUpperCase().replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#fafafa"/><circle cx="200" cy="200" r="90" fill="#f1f5f9"/><text x="200" y="225" text-anchor="middle" font-family="system-ui,sans-serif" font-size="68" font-weight="800" fill="#cbd5e1">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const ShopProducts: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<{ name?: string; status?: string; category?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  useEffect(() => {
    if (shopId) loadShopAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const loadShopAndProducts = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const shopResult = await getShopById(shopId);
      if (shopResult.success) {
        setShop(shopResult.data);
      } else {
        setError('Shop not found');
        setLoading(false);
        return;
      }
      const productsRef = query(collection(db, 'products'), where('shopId', '==', shopId));
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) })) as unknown as Product[];
        setProducts(list);
        setLoading(false);
      }, () => {
        setError('Failed to load products');
        setLoading(false);
      });
      return () => unsubscribe();
    } catch {
      setError('Failed to load shop and products');
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image: product.image || product.imageUrl || '',
      quantity: 1,
      shopId,
      shopName: shop?.name || '',
    });
  };

  const getCartQty = (productId: string) => {
    const item = cart.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  const handleQtyChange = (productId: string, newQty: number) => {
    if (newQty <= 0) removeFromCart(productId);
    else updateQuantity(productId, newQty);
  };

  const cartItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (error || (!loading && !shop)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-sm w-full shadow-card">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Products Not Found</h2>
          <p className="text-gray-500 text-sm mb-5">{error || 'The products you are looking for do not exist.'}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky shop header */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/shop/${shopId}`)}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
              aria-label="Back to shop"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[15px] font-extrabold text-gray-900 truncate">
                {loading ? <span className="inline-block w-32 h-4 bg-gray-100 animate-pulse rounded" /> : shop?.name}
              </h1>
              {!loading && (
                <span className={`text-[11px] font-bold ${shop?.status === 'open' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {shop?.status === 'open' ? '● Open Now' : '● Closed'}
                </span>
              )}
            </div>
          </div>

          {/* Cart button */}
          {cartItemsCount > 0 && (
            <button
              onClick={() => {/* cart drawer opens via navbar */}}
              className="flex items-center gap-2 bg-orange-500 text-white font-bold text-[13px] px-3.5 py-2 rounded-xl shadow-orange hover:bg-orange-600 transition-all flex-shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center shadow-card">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-orange-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Products Yet</h3>
            <p className="text-gray-500 text-sm">This shop hasn't added any products yet.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Products</h2>
              <span className="text-[13px] font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                {products.length} item{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product) => {
                const img = product.image || product.imageUrl;
                const isOut = !product.inStock;
                const qty = getCartQty(product.id);

                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-card-hover transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-3 overflow-hidden">
                      <img
                        src={img || fallbackImg(product.name)}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).src = fallbackImg(product.name); }}
                        loading="lazy"
                      />
                      {isOut && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-[11px] bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-wide">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-2 mb-1 flex-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[11px] text-gray-400 font-medium line-clamp-1 mb-1.5">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-1 mt-auto">
                        <span className="text-[15px] font-extrabold text-gray-900">₹{product.price}</span>

                        {qty > 0 ? (
                          <div className="flex items-center gap-0 bg-orange-500 rounded-lg overflow-hidden shadow-sm">
                            <button
                              onClick={() => handleQtyChange(product.id, qty - 1)}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-white font-extrabold text-[13px]">{qty}</span>
                            <button
                              onClick={() => handleQtyChange(product.id, qty + 1)}
                              className="w-7 h-7 flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={isOut}
                            className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-bold text-[12px] px-3 py-1.5 rounded-lg transition-all duration-150 shadow-sm"
                          >
                            <Plus className="h-3 w-3" />
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopProducts;
