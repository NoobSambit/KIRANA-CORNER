import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, Phone, Truck } from 'lucide-react';
import { getShopById } from '../utils/shopService';

const ShopDetails: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shopId) {
      loadShopDetails();
    }
  }, [shopId]);

  const loadShopDetails = async () => {
    if (!shopId) return;
    
    setLoading(true);
    try {
      const result = await getShopById(shopId);
      if (result.success) {
        setShop(result.data);
      } else {
        setError('Shop not found');
      }
    } catch (error) {
      console.error('Error loading shop details:', error);
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-600 mt-4 text-center">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Shop Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The shop you are looking for does not exist.'}</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Shop Details Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20">
          {/* Shop Image */}
          {shop.imageUrl && (
            <div className="mb-6">
              <img
                src={shop.imageUrl}
                alt={shop.name}
                className="w-full h-48 object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Shop Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{shop.name}</h1>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-semibold text-slate-900">{shop.rating}</span>
                  </div>
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

              {/* Address */}
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-slate-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">Address</p>
                  <p className="text-slate-600">{shop.address || `${shop.locationName}, Kolkata`}</p>
                </div>
              </div>

              {/* Phone */}
              {shop.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <p className="text-slate-600">{shop.phone}</p>
                  </div>
                </div>
              )}

              {/* Business Hours */}
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-medium text-slate-900">Business Hours</p>
                  <p className="text-slate-600">
                    {formatTime(shop.openingTime || '08:00')} - {formatTime(shop.closingTime || '22:00')}
                  </p>
                </div>
              </div>

              {/* Delivery */}
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-medium text-slate-900">Delivery</p>
                  <p className={`${shop.deliveryAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
                    {shop.deliveryAvailable ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              {shop.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">About</h3>
                  <p className="text-slate-600">{shop.description}</p>
                </div>
              )}

              {/* Location */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Location</h3>
                <p className="text-slate-600 mb-4">{shop.locationName}, Kolkata</p>
                
                {/* Mini Map Placeholder */}
                <div className="bg-slate-100 rounded-xl p-4 text-center">
                  <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Lat: {typeof shop.latitude === 'number' ? shop.latitude.toFixed(4) : 'N/A'}, Lng: {typeof shop.longitude === 'number' ? shop.longitude.toFixed(4) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button 
                  onClick={() => navigate(`/shop/${shopId}/products`)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Browse Products
                </button>
                <button className="w-full bg-white border-2 border-orange-500 text-orange-600 py-3 rounded-xl font-medium hover:bg-orange-50 transition-all duration-200">
                  Call Shop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;