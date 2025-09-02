import React from 'react';
import { MapPin, Star, Truck } from 'lucide-react';

interface ShopCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  distance: string;
  deliveryTime: string;
  category: string;
  isOpen: boolean;
  onClick: (id: string) => void;
}

const ShopCard: React.FC<ShopCardProps> = ({
  id,
  name,
  image,
  rating,
  distance,
  deliveryTime,
  category,
  isOpen,
  onClick
}) => {
  return (
    <div 
      onClick={() => onClick(id)}
      className="group bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/20 cursor-pointer"
    >
      <div className="relative mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-32 object-cover rounded-xl bg-gradient-to-br from-emerald-100 to-sky-100"
        />
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${
          isOpen 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {isOpen ? 'Open' : 'Closed'}
        </div>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
          <span className="text-xs font-medium text-slate-700">{rating}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-slate-600">{category}</p>
        
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{distance}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Truck className="h-3 w-3" />
            <span>{deliveryTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;