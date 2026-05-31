import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { useCart } from './CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  shop: string;
  inStock: boolean;
  stock?: number;
  shopDistance?: number;
  onAddToCart: (id: string) => void;
  shopId?: string;
  shopName?: string;
  imageUrl?: string;
  canonicalName?: string;
  normalizedName?: string;
  ingredientIds?: string[];
  aliases?: string[];
  category?: string;
  subcategory?: string;
}

const fallbackSvg = (name: string) => {
  const label = (name || 'P').slice(0, 2).toUpperCase().replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F5F3EE"/><text x="100" y="120" text-anchor="middle" font-family="system-ui,sans-serif" font-size="56" font-weight="800" fill="#D1CAB8">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({
  id, name, price, originalPrice, image, rating, shop,
  inStock, stock, shopDistance, onAddToCart,
}) => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [imgSrc, setImgSrc] = React.useState(image || fallbackSvg(name));

  React.useEffect(() => { setImgSrc(image || fallbackSvg(name)); }, [image, name]);

  const cartItem = cart.find((i) => i.id === id);
  const qty      = cartItem?.quantity ?? 0;
  const isOut    = !inStock || (stock !== undefined && stock === 0);
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-hover)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-brand)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      {/* Image area */}
      <div className="relative aspect-square flex items-center justify-center p-3 overflow-hidden"
        style={{ background: 'var(--bg-elevated)' }}>
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgSrc(fallbackSvg(name))}
        />

        {/* Discount badge */}
        {discount > 0 && inStock && (
          <div className="absolute top-2 left-2 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md leading-none z-10"
            style={{ background: 'var(--brand)' }}>
            {discount}% OFF
          </div>
        )}

        {/* Out of stock overlay */}
        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(var(--bg-card-rgb, 255,255,255),0.82)' }}>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm uppercase tracking-wide"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Out of Stock
            </span>
          </div>
        )}

        {/* Rating chip */}
        {rating > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md shadow-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Star className="h-2.5 w-2.5 text-amber-400 fill-current" />
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-2.5 pt-2">
        {/* Shop/distance */}
        <div className="flex items-center gap-1 mb-1 min-w-0">
          {shopDistance !== undefined && (
            <span className="flex-none text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none"
              style={{ background: 'var(--pastel-peach)', color: 'var(--brand)' }}>
              {shopDistance < 1 ? `${Math.round(shopDistance * 1000)}m` : `${shopDistance.toFixed(1)}km`}
            </span>
          )}
          <span className="text-[10px] font-medium truncate min-w-0" style={{ color: 'var(--text-muted)' }}>{shop}</span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-[13px] leading-snug line-clamp-2 mb-1.5 flex-1"
          style={{ color: 'var(--text-primary)' }}>
          {name}
        </h3>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-1 mt-auto">
          <div className="flex flex-col leading-none">
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] line-through font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
                ₹{originalPrice}
              </span>
            )}
            <span className="text-[15px] font-extrabold" style={{ color: 'var(--text-primary)' }}>₹{price}</span>
          </div>

          {qty > 0 ? (
            <div className="flex items-center rounded-lg overflow-hidden shadow-sm"
              style={{ background: 'var(--brand)' }}>
              <button
                onClick={() => qty <= 1 ? removeFromCart(id) : updateQuantity(id, qty - 1)}
                className="w-7 h-7 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Decrease"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-7 text-center text-white font-extrabold text-[13px] select-none">{qty}</span>
              <button
                onClick={() => updateQuantity(id, qty + 1)}
                className="w-7 h-7 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                aria-label="Increase"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => !isOut && onAddToCart(id)}
              disabled={isOut}
              className="flex items-center gap-1 font-bold text-[12px] px-3 py-1.5 rounded-lg transition-all duration-150 shadow-sm"
              style={isOut ? {
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed',
              } : {
                background: 'var(--pastel-peach)',
                border: '1px solid var(--border-brand)',
                color: 'var(--brand)',
              }}
              onMouseEnter={(e) => { if (!isOut) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)'; } }}
              onMouseLeave={(e) => { if (!isOut) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pastel-peach)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-brand)'; } }}
            >
              <Plus className="h-3 w-3" />
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Skeleton card */
export const ProductCardSkeleton: React.FC = () => (
  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
    <div className="aspect-square skeleton" />
    <div className="p-2.5 flex flex-col gap-2">
      <div className="h-2.5 skeleton rounded w-2/3" />
      <div className="h-3 skeleton rounded w-full" />
      <div className="h-3 skeleton rounded w-4/5" />
      <div className="flex justify-between items-center mt-1">
        <div className="h-4 skeleton rounded w-12" />
        <div className="h-7 skeleton rounded-lg w-16" />
      </div>
    </div>
  </div>
);

export default ProductCard;
