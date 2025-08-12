import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Save, 
  X, 
  MapPin, 
  Clock, 
  Truck, 
  Image as ImageIcon,
  Store,
  FileText,
  Navigation
} from 'lucide-react';
// @ts-expect-error: Importing from JS module without type declaration
import { getShopByOwnerId, updateShopInfo, validateShopData } from '../utils/shopService';
// @ts-expect-error: Importing from JS module without type declaration
import { auth } from '../firebase';
import Toast from './Toast';

interface ShopProfileEditorProps {
  startInEditMode?: boolean;
}

const ShopProfileEditor: React.FC<ShopProfileEditorProps> = ({ startInEditMode = false }) => {
  interface ShopFormData {
    name: string;
    category: string;
    address: string;
    description: string;
    openingTime: string;
    closingTime: string;
    deliveryAvailable: boolean;
    imageUrl: string;
    latitude: string | number;
    longitude: string | number;
  }

  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopData, setShopData] = useState<ShopFormData>({
    name: '',
    category: 'Kirana',
    address: '',
    description: '',
    openingTime: '09:00',
    closingTime: '21:00',
    deliveryAvailable: true,
    imageUrl: '',
    latitude: '',
    longitude: ''
  });
  const [originalData, setOriginalData] = useState<ShopFormData>(shopData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'warning' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    loadShopData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShopData = async (): Promise<void> => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const result = await getShopByOwnerId(auth.currentUser.uid);
      if (result.success) {
        setShopData(result.data as ShopFormData);
        setOriginalData(result.data as ShopFormData);
        // If shop exists and we were asked to start in edit mode only for new shops, keep current state
      } else {
        // New shop - keep default values
        console.log('No existing shop data found, using defaults');
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
      showToast('Failed to load shop data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ShopFormData, value: ShopFormData[keyof ShopFormData]) => {
    setShopData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[String(field)]) {
      setErrors(prev => ({
        ...prev,
        [String(field)]: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    // Validate data
    const validation = validateShopData(shopData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showToast('Please fix the errors before saving', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const result = await updateShopInfo(auth.currentUser.uid, shopData);
      if (result.success) {
        setOriginalData(shopData);
        setIsEditing(false);
        setErrors({});
        showToast('Shop profile updated successfully! 🎉', 'success');
      } else {
        showToast('Failed to update shop profile', 'error');
      }
    } catch (error) {
      console.error('Error saving shop data:', error);
      showToast('Failed to update shop profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShopData(originalData);
    setIsEditing(false);
    setErrors({});
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
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-slate-600 mt-4 text-center">Loading shop profile...</p>
      </div>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Form */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              🏪 Shop Profile
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Shop Name */}
            <div>
              <label htmlFor="shop-name" className="block text-sm font-medium text-slate-200 mb-2">
                <Store className="h-4 w-4 inline mr-2" />
                Shop Name *
              </label>
              {isEditing ? (
                <input
                  id="shop-name"
                  type="text"
                  value={shopData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 placeholder-slate-400 ${
                    errors.name ? 'border-red-400' : 'border-slate-600'
                  }`}
                  placeholder="Enter your shop name"
                />
              ) : (
                <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100">
                  {shopData.name || 'Not set'}
                </p>
              )}
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="shop-address" className="block text-sm font-medium text-slate-200 mb-2">
                <MapPin className="h-4 w-4 inline mr-2" />
                Address *
              </label>
              {isEditing ? (
                <textarea
                  id="shop-address"
                  value={shopData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 placeholder-slate-400 resize-none ${
                    errors.address ? 'border-red-400' : 'border-slate-600'
                  }`}
                  placeholder="Enter your complete shop address"
                />
              ) : (
                <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100">
                  {shopData.address || 'Not set'}
                </p>
              )}
              {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="shop-category" className="block text-sm font-medium text-slate-200 mb-2">
                <Store className="h-4 w-4 inline mr-2" />
                Category *
              </label>
              {isEditing ? (
                <select
                  id="shop-category"
                  value={shopData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 ${
                    errors.category ? 'border-red-400' : 'border-slate-600'
                  }`}
                >
                  {['Medical Store','Kirana','Dairy','Vegetables','Fruits','Snacks','Beverages','Personal Care','Household','Bakery','Spices','Meat & Fish','Sweets','Electronics','Stationery']
                    .map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              ) : (
                <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100">
                  {shopData.category || 'Not set'}
                </p>
              )}
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Business Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="opening-time" className="block text-sm font-medium text-slate-200 mb-2">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Opening Time *
                </label>
                {isEditing ? (
                  <input
                    id="opening-time"
                    type="time"
                    value={shopData.openingTime}
                    onChange={(e) => handleInputChange('openingTime', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 ${
                      errors.openingTime ? 'border-red-400' : 'border-slate-600'
                    }`}
                  />
                ) : (
                  <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100">
                    {formatTime(shopData.openingTime) || 'Not set'}
                  </p>
                )}
                {errors.openingTime && <p className="text-red-600 text-sm mt-1">{errors.openingTime}</p>}
              </div>
              
              <div>
                <label htmlFor="closing-time" className="block text-sm font-medium text-slate-200 mb-2">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Closing Time *
                </label>
                {isEditing ? (
                  <input
                    id="closing-time"
                    type="time"
                    value={shopData.closingTime}
                    onChange={(e) => handleInputChange('closingTime', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 ${
                      errors.closingTime ? 'border-red-400' : 'border-slate-600'
                    }`}
                  />
                ) : (
                  <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100">
                    {formatTime(shopData.closingTime) || 'Not set'}
                  </p>
                )}
                {errors.closingTime && <p className="text-red-600 text-sm mt-1">{errors.closingTime}</p>}
              </div>
            </div>

            {/* Delivery Available */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                <Truck className="h-4 w-4 inline mr-2" />
                Delivery Service
              </label>
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('deliveryAvailable', !shopData.deliveryAvailable)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      shopData.deliveryAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    aria-label="Toggle delivery availability"
                    title="Toggle delivery availability"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        shopData.deliveryAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-slate-200">
                    {shopData.deliveryAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
              ) : (
                <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100">
                  {shopData.deliveryAvailable ? '✅ Available' : '❌ Not Available'}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                About Your Shop
              </label>
              {isEditing ? (
                <textarea
                  value={shopData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 placeholder-slate-400 resize-none"
                  placeholder="Tell customers about your shop, specialties, etc."
                />
              ) : (
                <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                  {shopData.description || 'No description provided'}
                </p>
              )}
            </div>

            {/* Shop Image URL */}
            <div>
              <label htmlFor="shop-image-url" className="block text-sm font-medium text-slate-200 mb-2">
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Shop Image URL
              </label>
              {isEditing ? (
                <input
                  id="shop-image-url"
                  type="url"
                  value={shopData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 placeholder-slate-400 ${
                    errors.imageUrl ? 'border-red-400' : 'border-slate-600'
                  }`}
                  placeholder="https://example.com/shop-image.jpg"
                />
              ) : (
                <p className="px-4 py-3 bg-slate-900/60 rounded-xl text-slate-100 break-all">
                  {shopData.imageUrl || 'No image set'}
                </p>
              )}
              {errors.imageUrl && <p className="text-red-600 text-sm mt-1">{errors.imageUrl}</p>}
            </div>

            {/* Geolocation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-slate-200 mb-2">
                  <Navigation className="h-4 w-4 inline mr-2" />
                  Latitude
                </label>
                {isEditing ? (
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={shopData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 placeholder-slate-400 ${
                      errors.latitude ? 'border-red-400' : 'border-slate-600'
                    }`}
                    placeholder="28.6139"
                  />
                ) : (
                  <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                    {shopData.latitude || 'Not set'}
                  </p>
                )}
                {errors.latitude && <p className="text-red-600 text-sm mt-1">{errors.latitude}</p>}
              </div>
              
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-slate-200 mb-2">
                  <Navigation className="h-4 w-4 inline mr-2" />
                  Longitude
                </label>
                {isEditing ? (
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={shopData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-slate-900/70 text-slate-100 placeholder-slate-400 ${
                      errors.longitude ? 'border-red-400' : 'border-slate-600'
                    }`}
                    placeholder="77.2090"
                  />
                ) : (
                  <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                    {shopData.longitude || 'Not set'}
                  </p>
                )}
                {errors.longitude && <p className="text-red-600 text-sm mt-1">{errors.longitude}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">📱 Live Preview</h3>
          
          <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-700">
            {/* Shop Image */}
            {shopData.imageUrl && (
              <div className="mb-4">
                <img
                  src={shopData.imageUrl}
                  alt={shopData.name}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Shop Info */}
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-slate-100">
                {shopData.name || 'Your Shop Name'}
              </h4>
              
              {shopData.address && (
                <div className="flex items-start space-x-2 text-slate-300">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{shopData.address}</span>
                </div>
              )}
              
                <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(shopData.openingTime)} - {formatTime(shopData.closingTime)}
                  </span>
                </div>
                
                <div className={`flex items-center space-x-1 ${
                  shopData.deliveryAvailable ? 'text-emerald-600' : 'text-slate-500'
                }`}>
                  <Truck className="h-4 w-4" />
                  <span>{shopData.deliveryAvailable ? 'Delivery' : 'No Delivery'}</span>
                </div>
                {shopData.category && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {shopData.category}
                  </span>
                )}
              </div>
              
              {shopData.description && (
                <p className="text-sm text-slate-300 mt-3">
                  {shopData.description}
                </p>
              )}
              
              {(shopData.latitude && shopData.longitude) && (
                <div className="flex items-center space-x-1 text-xs text-slate-400 break-all">
                  <Navigation className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-full">{String(shopData.latitude)}, {String(shopData.longitude)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-slate-900/60 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-300">
              💡 This is how your shop will appear to customers in the app
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopProfileEditor;