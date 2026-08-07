import React from 'react';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import { ShoppingBag } from 'lucide-react';

interface Product {
  id: string; name: string; price: number; originalPrice?: number; image: string;
  rating: number; shop: string; inStock: boolean; category: string;
  stock?: number; shopDistance?: number; shopId?: string; shopName?: string;
  imageUrl?: string; canonicalName?: string; normalizedName?: string; subcategory?: string;
  ingredientIds?: string[]; aliases?: string[]; shopImage?: string;
}

interface ProductGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  onAddToCart: (id: string) => void;
  loading?: boolean;
  title?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products, viewMode, onAddToCart, loading = false, title,
}) => {
  if (loading) {
    return (
      <div>
        {title && <h2 className="section-title mb-4">{title}</h2>}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[250px]"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--pastel-peach)' }}>
          <ShoppingBag className="h-7 w-7" style={{ color: 'var(--brand)' }} />
        </div>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No products found</h3>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <div className="section-header mb-4">
          <h2 className="section-title">{title}</h2>
        </div>
      )}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4'
          : 'flex flex-col gap-3'
      }>
        {products.map((p) => <ProductCard key={p.id} {...p} onAddToCart={onAddToCart} />)}
      </div>
    </div>
  );
};

export default ProductGrid;
