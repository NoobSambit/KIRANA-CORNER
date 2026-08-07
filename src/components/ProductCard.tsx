import React from 'react';
import { Heart, Minus, Plus, Star } from 'lucide-react';
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
  shopImage?: string;
}

const fallbackSvg = (name: string) => {
  const label = (name || 'P').slice(0, 2).toUpperCase().replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F5F3EE"/><text x="100" y="120" text-anchor="middle" font-family="system-ui,sans-serif" font-size="56" font-weight="800" fill="#D1CAB8">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  shop,
  inStock,
  stock,
  shopDistance,
  onAddToCart,
}) => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const [imgSrc, setImgSrc] = React.useState(image || fallbackSvg(name));

  React.useEffect(() => {
    setImgSrc(image || fallbackSvg(name));
  }, [image, name]);

  const cartItem = cart.find((item) => item.id === id);
  const qty = cartItem?.quantity ?? 0;
  const isOut = !inStock || (stock !== undefined && stock === 0);
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const distanceLabel = shopDistance === undefined
    ? null
    : shopDistance < 1
      ? `${Math.round(shopDistance * 1000)} m away`
      : `${shopDistance.toFixed(1)} km away`;

  return (
    <article className="marketplace-product-card group flex min-w-0 flex-col overflow-hidden rounded-[16px]">
      <div className="marketplace-product-image relative flex aspect-[1.42/1] items-center justify-center overflow-hidden p-3">
        <img
          src={imgSrc}
          alt={name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setImgSrc(fallbackSvg(name))}
        />

        {discount > 0 && inStock && (
          <div className="absolute left-2 top-2 z-10 rounded-md bg-[#fff6ee] px-2 py-1 text-[10px] font-extrabold leading-none text-[#d7601b]">
            {discount}% OFF
          </div>
        )}

        <button
          type="button"
          aria-label={`Save ${name}`}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#d8d5d0] bg-white/90 text-[#4d4b49] transition hover:border-[#e4742b] hover:text-[#e4742b]"
        >
          <Heart className="h-4 w-4" />
        </button>

        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75">
            <span className="rounded-lg border border-[#d8d5d0] bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#716d69] shadow-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#8c9998]">
          <Star className="h-3 w-3 fill-[#f7a51c] text-[#f7a51c]" />
          <span className="font-bold text-[#f7b33d]">{rating > 0 ? rating.toFixed(1) : '—'}</span>
          <span className="text-[#53605f]">·</span>
          <span className="truncate">{shop}</span>
        </div>

        <h3 className="mb-2 line-clamp-2 flex-1 text-[13px] font-semibold leading-snug text-[#e9eeed]">
          {name}
        </h3>

        <div className="mb-3 flex items-center gap-1 text-[10px] font-medium text-[#6f7d7c]">
          {distanceLabel || 'Nearby store'}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col leading-none">
            {originalPrice && originalPrice > price && (
              <span className="mb-1 text-[10px] font-medium text-[#667271] line-through">₹{originalPrice}</span>
            )}
            <span className="text-[15px] font-extrabold text-[#f3f6f5]">₹{price}</span>
          </div>

          {qty > 0 ? (
            <div className="flex items-center overflow-hidden rounded-lg bg-[#ff7718] shadow-sm">
              <button
                onClick={() => (qty <= 1 ? removeFromCart(id) : updateQuantity(id, qty - 1))}
                className="flex h-7 w-7 items-center justify-center text-white transition-opacity hover:opacity-80"
                aria-label="Decrease"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-7 select-none text-center text-[13px] font-extrabold text-white">{qty}</span>
              <button
                onClick={() => updateQuantity(id, qty + 1)}
                className="flex h-7 w-7 items-center justify-center text-white transition-opacity hover:opacity-80"
                aria-label="Increase"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => !isOut && onAddToCart(id)}
              disabled={isOut}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all duration-150"
              style={isOut
                ? { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                : { background: 'transparent', borderColor: 'rgba(255,119,24,0.72)', color: '#ff8b32' }}
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="marketplace-product-card overflow-hidden rounded-[16px]">
    <div className="aspect-[1.42/1] skeleton" />
    <div className="flex flex-col gap-2 p-3">
      <div className="h-2.5 w-2/3 rounded skeleton" />
      <div className="h-3 w-full rounded skeleton" />
      <div className="h-3 w-4/5 rounded skeleton" />
      <div className="mt-1 flex items-center justify-between">
        <div className="h-4 w-12 rounded skeleton" />
        <div className="h-7 w-16 rounded-lg skeleton" />
      </div>
    </div>
  </div>
);

export default ProductCard;
