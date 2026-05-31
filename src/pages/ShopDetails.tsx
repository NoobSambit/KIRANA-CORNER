import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Clock, Phone, Truck, Store,
  CheckCircle, ShoppingBag, ExternalLink,
} from 'lucide-react';
import { getShopById } from '../utils/shopService';

const ShopDetails: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shopId) loadShopDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const loadShopDetails = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const result = await getShopById(shopId);
      if (result.success) setShop(result.data);
      else setError('Shop not found');
    } catch {
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 || 12;
    return `${display}:${time.split(':')[1]} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Skeleton */}
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-100 rounded-2xl" />
            <div className="h-6 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center max-w-sm w-full shadow-card">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-gray-500 text-sm mb-5">{error || "The shop you're looking for doesn't exist."}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOpen = shop.status === 'open';

  return (
    <div className="min-h-screen bg-surface">
      {/* Banner image */}
      <div className="relative w-full h-44 sm:h-56 bg-gradient-to-br from-orange-50 to-amber-100 overflow-hidden">
        {shop.imageUrl ? (
          <img
            src={shop.imageUrl}
            alt={shop.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="h-16 w-16 text-orange-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 font-bold text-[13px] px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 -mt-4 relative z-10">
        {/* Shop identity card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-4">
          <div className="flex items-start gap-4">
            {/* Logo circle */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              {shop.imageUrl ? (
                <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Store className="h-7 w-7 text-orange-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                {/* Status */}
                <span className={isOpen ? 'badge-open' : 'badge-closed'}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                {/* Category */}
                <span className="text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                  {shop.category}
                </span>
                {/* Rating */}
                {shop.rating && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {shop.rating}
                  </span>
                )}
                {/* Verified */}
                {shop.verified && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    <CheckCircle className="h-2.5 w-2.5" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata chips row */}
          <div className="flex flex-wrap gap-2 mt-4">
            <MetaChip icon={<MapPin className="h-3.5 w-3.5" />} text={shop.address || `${shop.locationName}, Kolkata`} />
            <MetaChip icon={<Clock className="h-3.5 w-3.5" />} text={`${formatTime(shop.openingTime || '08:00')} – ${formatTime(shop.closingTime || '22:00')}`} />
            {shop.phone && <MetaChip icon={<Phone className="h-3.5 w-3.5" />} text={shop.phone} />}
            <MetaChip
              icon={<Truck className="h-3.5 w-3.5" />}
              text={shop.deliveryAvailable ? 'Delivery Available' : 'No Delivery'}
              highlight={!!shop.deliveryAvailable}
            />
          </div>

          {/* Description */}
          {shop.description && (
            <p className="mt-4 text-[13px] text-gray-600 font-medium leading-relaxed border-t border-gray-50 pt-4">
              {shop.description}
            </p>
          )}
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/shop/${shopId}/products`)}
            className="btn-primary flex items-center justify-center gap-2 py-3.5"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            Browse Products
          </button>
          <button
            className="btn-ghost flex items-center justify-center gap-2 py-3.5"
            onClick={() => shop.phone && (window.location.href = `tel:${shop.phone}`)}
          >
            <Phone className="h-4.5 w-4.5" />
            Call Shop
          </button>
        </div>
      </div>
    </div>
  );
};

const MetaChip: React.FC<{ icon: React.ReactNode; text: string; highlight?: boolean }> = ({ icon, text, highlight }) => (
  <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border ${
    highlight
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'
  }`}>
    <span className={highlight ? 'text-emerald-500' : 'text-gray-400'}>{icon}</span>
    {text}
  </span>
);

export default ShopDetails;