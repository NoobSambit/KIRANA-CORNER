import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, Star, Maximize2, Minimize2, ExternalLink, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { filterShopsByDistance } from '../utils/geoUtils.ts';


// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const shopIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Shop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rating: number;
  category: string;
  status: string;
  locationName: string;
  address?: string;
  phone?: string;
  distance?: number;
  openingTime?: string;
  closingTime?: string;
  deliveryAvailable?: boolean;
  imageUrl?: string;
  verified?: boolean;
}

interface MapSectionProps {
  shops: Shop[];
  allShops: Shop[];
  userLocation: { lat: number; lng: number };
}

// Component to handle map events and dynamic shop loading
const MapEventHandler: React.FC<{
  allShops: Shop[];
  userLocation: { lat: number; lng: number };
  onShopsUpdate: (shops: Shop[], totalCount: number) => void;
}> = ({ allShops, userLocation, onShopsUpdate }) => {
  const map = useMapEvents({
    zoomend: () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      
      // Dynamic radius based on zoom level
      let radius;
      if (zoom >= 14) {
        radius = 3; // 3km for close zoom (Salt Lake area)
      } else if (zoom >= 12) {
        radius = 8; // 8km for medium zoom
      } else {
        radius = 20; // 20km for far zoom (most of Kolkata)
      }
      
      // Filter shops based on current center and radius
      const visibleShops = filterShopsByDistance(
        allShops as any[], 
        { lat: center.lat, lng: center.lng }, 
        radius
      );
      
      console.log(`🔍 Zoom: ${zoom}, Radius: ${radius}km, Visible shops: ${visibleShops.length}`);
      onShopsUpdate(visibleShops as any[], allShops.length);
    },
    
    moveend: () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      
      // Dynamic radius based on zoom level
      let radius;
      if (zoom >= 14) {
        radius = 3;
      } else if (zoom >= 12) {
        radius = 8;
      } else {
        radius = 20;
      }
      
      // Filter shops based on current center and radius
      const visibleShops = filterShopsByDistance(
        allShops as any[], 
        { lat: center.lat, lng: center.lng }, 
        radius
      );
      
      onShopsUpdate(visibleShops as any[], allShops.length);
    }
  });
  
  return null;
};

const MapSection: React.FC<MapSectionProps> = ({ shops, allShops, userLocation }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [displayedShops, setDisplayedShops] = useState(shops);
  const [totalShopsCount, setTotalShopsCount] = useState(allShops.length);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const navigate = useNavigate();

  console.log(`🗺️ Map: Received ${shops.length} initial shops, ${allShops.length} total shops`);
  console.log(`📍 User location: ${userLocation.lat}, ${userLocation.lng}`);

  const handleShopsUpdate = useCallback((newShops: Shop[], totalCount: number) => {
    setDisplayedShops(newShops);
    setTotalShopsCount(totalCount);
  }, []);

  const handleResetView = () => {
    if (mapRef) {
      mapRef.setView([userLocation.lat, userLocation.lng], 14);
          // Reset to nearby shops
    const nearbyShops = filterShopsByDistance(allShops as any[], userLocation, 3);
    setDisplayedShops(nearbyShops as any);
    }
  };

  const handleViewShop = (shopId: string) => {
    navigate(`/shop/${shopId}`);
  };

  return (
    <div className={`bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20 dark:border-white/10 transition-all duration-500 ${
      isExpanded ? 'fixed inset-4 z-50 bg-white/95 dark:bg-slate-900' : ''
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <MapPin className="h-6 w-6 text-orange-600 mr-2" />
          Shops Near You ({displayedShops.length})
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>You</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full ml-4"></div>
            <span>Shops</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              Showing {displayedShops.length} of {totalShopsCount} shops
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetView}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset View</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Minimize</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Expand Map</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className={`rounded-xl overflow-hidden shadow-inner transition-all duration-500 ${
        isExpanded ? 'h-[calc(100vh-160px)]' : 'h-80'
      }`}>
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          className="rounded-xl"
          ref={setMapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Map event handler for dynamic shop loading */}
          <MapEventHandler 
            allShops={allShops} 
            userLocation={userLocation} 
            onShopsUpdate={handleShopsUpdate} 
          />
          
          {/* User location marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
                <div className="text-center p-2">
                  <div className="font-semibold text-slate-900 dark:text-white">You are here</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Salt Lake City Center</div>
              </div>
            </Popup>
          </Marker>
          
          {/* Shop markers */}
          {displayedShops.map((shop: any) => (
            <Marker 
              key={shop.id} 
              position={[shop.latitude, shop.longitude]} 
              icon={shopIcon}
            >
              <Popup>
                <div className="p-3 min-w-[220px]">
                  <div className="font-semibold text-slate-900 dark:text-white mb-1">{shop.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">{shop.locationName}</div>
                  {shop.address && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{shop.address}</div>
                  )}
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{shop.rating}</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">{shop.category}</div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shop.status === 'open'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {shop.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                    {shop.phone && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{shop.phone}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleViewShop(shop.id)}
                    className="w-full mt-3 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Shop</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-500"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default MapSection;