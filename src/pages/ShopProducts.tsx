import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
// @ts-expect-error: JS module without TS types
import { db } from '../firebase';
// @ts-expect-error: JS module without TS types
import { getShopById } from '../utils/shopService';
import { useCart } from '../components/CartContext';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  category: string;
  shopId: string;
  shopName: string;
}

const ShopProducts: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<{ name?: string; status?: string; category?: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    if (shopId) {
      loadShopAndProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const loadShopAndProducts = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      // Load shop details
      const shopResult = await getShopById(shopId);
      if (shopResult.success) {
        setShop(shopResult.data);
      } else {
        setError('Shop not found');
        setLoading(false);
        return;
      }

      // Load products from top-level 'products' by shopId
      const productsRef = query(collection(db, 'products'), where('shopId', '==', shopId));
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        })) as unknown as Product[];
        
        setProducts(productList);
        setLoading(false);
      }, (error) => {
        console.error('Error loading products:', error);
        setError('Failed to load products');
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading shop and products:', error);
      setError('Failed to load shop and products');
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number((product as unknown as { price?: number }).price || 0),
      image: (product as unknown as { image?: string; imageUrl?: string }).image || (product as unknown as { imageUrl?: string }).imageUrl || '',
      quantity: 1,
      shopId: shopId,
      shopName: shop?.name || '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Products Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The products you are looking for do not exist.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/shop/${shopId}`)}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Shop</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{shop.name}</h1>
              <p className="text-slate-600">Browse our products</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                shop.status === 'open'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {shop.status === 'open' ? 'Open Now' : 'Closed'}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {shop.category}
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-white/20 text-center">
            <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Products Available</h3>
            <p className="text-slate-600">This shop hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
              >
                {/* Product Image */}
                <div className="mb-4">
                  <img
                     src={(product as unknown as { image?: string; imageUrl?: string }).image || (product as unknown as { imageUrl?: string }).imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/33239/rice-grain-seed-food.jpg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 text-lg line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <p className="text-slate-600 text-sm line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">
                      ₹{product.price}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.inStock
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                    className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      product.inStock
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Count */}
        {products.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProducts; 