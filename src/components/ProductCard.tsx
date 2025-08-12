import React from 'react';
import { Star, Plus } from 'lucide-react';

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
}

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
  onAddToCart
}) => {
  return (
    <div className="group bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 dark:border-white/10 aspect-square flex flex-col">
      <div className="relative mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-32 object-cover rounded-xl bg-gradient-to-br from-orange-100 to-red-100"
        />
        {(!inStock || (stock !== undefined && stock === 0)) && (
          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{rating}</span>
        </div>
      </div>
      
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-orange-600 transition-colors line-clamp-2">
          {name}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{shop}</p>
        
        {/* Stock and distance info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          {stock !== undefined && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              stock > 10 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
              stock > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </span>
          )}
          {shopDistance !== undefined && (
            <span className="text-slate-500 dark:text-slate-400">
              {shopDistance < 1 ? `${Math.round(shopDistance * 1000)}m` : `${shopDistance.toFixed(1)}km`}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">₹{price}</span>
            {originalPrice && (
              <span className="text-xs text-slate-500 dark:text-slate-400 line-through">₹{originalPrice}</span>
            )}
          </div>
          
          <button
            onClick={() => onAddToCart(id)}
            disabled={!inStock || (stock !== undefined && stock === 0)}
            title={(inStock && (stock === undefined || stock > 0)) ? `Add ${name} to cart` : `${name} is out of stock`}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;