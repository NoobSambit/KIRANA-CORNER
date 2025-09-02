import React from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  shop: string;
  inStock: boolean;
  category: string;
  stock?: number;
  shopDistance?: number;
  shopId?: string;
  shopName?: string;
}

interface ProductGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  onAddToCart: (productId: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, viewMode, onAddToCart }) => {
  if (products.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-white/20 dark:border-white/10 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No products found</h3>
        <p className="text-slate-600 dark:text-slate-300">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          🔥 Available Products
        </h2>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {products.length} product{products.length !== 1 ? 's' : ''} found
        </span>
      </div>
      
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8' 
          : 'grid-cols-1'
      }`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;