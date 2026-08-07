import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import { ChevronDown, Maximize2, Minimize2, Navigation, RotateCcw, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { filterShopsByDistance } from '../utils/geoUtils.ts';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const STORE_THUMBNAIL = '/images/stores/kirana-storefront.png';
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const makePin = (background: string, glyph: string, size = 38) => L.divIcon({
  html: `<div style="width:${size}px;height:${size + 10}px;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))"><div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 6px;background:${background};display:flex;align-items:center;justify-content:center;transform:rotate(45deg);border:2.5px solid rgba(255,255,255,.9)"><div style="transform:rotate(-45deg);line-height:0">${glyph}</div></div><div style="width:3px;height:6px;background:${background};border-radius:0 0 2px 2px;margin-top:-2px"></div></div>`,
  className: '',
  iconSize: [size, size + 10],
  iconAnchor: [size / 2, size + 10],
  popupAnchor: [0, -(size + 10)],
});

const shopPin = makePin('#ff7718', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-6h16l1 6"/><path d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 2-2"/><path d="M5 21V11m14 10V11"/><rect x="9" y="14" width="6" height="7" rx="1"/></svg>');
const userPin = makePin('#35c97b', '<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="3"/></svg>', 34);

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
  distance?: number;
  deliveryAvailable?: boolean;
  imageUrl?: string;
  verified?: boolean;
}

interface MapSectionProps {
  shops: Shop[];
  allShops: Shop[];
  userLocation: { lat: number; lng: number };
}

const MapSection: React.FC<MapSectionProps> = ({ shops, allShops, userLocation }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [displayedShops, setDisplayedShops] = useState(shops);
  const featuredShop = displayedShops[0];

  useEffect(() => setDisplayedShops(shops), [shops]);

  useEffect(() => {
    if (!mapRef) return undefined;
    mapRef.invalidateSize({ animate: false });
    const timer = window.setTimeout(() => mapRef.invalidateSize({ animate: false }), 350);
    return () => window.clearTimeout(timer);
  }, [isExpanded, mapRef]);

  const mapClassName = useMemo(() => theme === 'dark' ? 'map-dark-mode' : '', [theme]);

  const resetMap = () => {
    if (!mapRef) return;
    mapRef.setView([userLocation.lat, userLocation.lng], 14);
    setDisplayedShops(filterShopsByDistance(allShops, userLocation, 3));
  };

  return (
    <>
      {isExpanded && <div className="fixed inset-0 z-[59] bg-black/60 backdrop-blur-sm" onClick={() => setIsExpanded(false)} />}
      <section className={`marketplace-map relative overflow-hidden rounded-[18px] border border-[#2b3a3c] bg-[#101a1c] ${isExpanded ? 'fixed inset-4 top-20 z-[95] flex flex-col' : ''}`}>
        <div className={`relative z-[2] ${isExpanded ? 'min-h-0 flex-1' : 'h-[300px] sm:h-[320px]'}`}>
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            ref={setMapRef}
            zoomControl={false}
            className={mapClassName}
          >
            <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={20} />
            <ZoomControl position="topright" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userPin}>
              <Popup>
                <div className="min-w-[160px] py-1"><p className="font-extrabold text-[13px] text-gray-900">You are here</p><p className="mt-0.5 text-[11px] text-gray-500">Salt Lake, Kolkata</p></div>
              </Popup>
            </Marker>
            {displayedShops.map((shop) => (
              <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={shopPin}>
                <Popup>
                  <div className="min-w-[210px] py-1.5">
                    <div className="mb-1.5 flex items-start justify-between gap-2"><p className="text-[13px] font-extrabold leading-snug text-gray-900">{shop.name}</p><span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{shop.status === 'open' ? 'Open' : 'Closed'}</span></div>
                    <p className="mb-1.5 text-[11px] text-gray-500">{shop.locationName}</p>
                    <div className="mb-2.5 flex items-center gap-2"><span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600"><Star className="h-3 w-3 fill-current" />{shop.rating.toFixed(1)}</span><span className="text-gray-300">·</span><span className="text-[11px] text-gray-500">{shop.category}</span></div>
                    <button type="button" onClick={() => navigate(`/shop/${shop.id}`)} className="w-full rounded-lg bg-[#f97316] py-2 text-[12px] font-bold text-white">View store <ChevronDown className="inline h-3 w-3 -rotate-90" /></button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-4">
            <div className="pointer-events-auto rounded-[12px] border border-[#304144] bg-[#0c1416]/90 px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#172b2c] text-[#54c7a3]"><Navigation className="h-3.5 w-3.5" /></div>
                <div><h2 className="text-[16px] font-bold text-[#f1f5f4]">Shops near you</h2><p className="mt-0.5 text-[11px] text-[#8e9b9a]">{displayedShops.length} stores within your map area</p><button type="button" onClick={() => navigate('/shop')} className="mt-2 text-[11px] font-bold text-[#ff8525]">View all stores <ChevronRightIcon /></button></div>
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-1 rounded-[9px] border border-[#3a494b] bg-[#0d1719]/90 px-3 py-2 text-[12px] font-semibold text-[#c2ccca] backdrop-blur-md"><span>Within 3 km</span><ChevronDown className="h-3.5 w-3.5 text-[#899594]" /></div>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-[10px] border border-[#334345] bg-[#0c1416]/90 px-3 py-2 text-[11px] font-semibold text-[#aab5b3] backdrop-blur-md"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#35c97b]" />You</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff7718]" />Stores</span></div>

          <div className="absolute bottom-4 right-4 flex gap-2">
            <button type="button" onClick={resetMap} aria-label="Reset map" className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#3a494b] bg-[#0c1416]/90 text-[#c4d0cd] backdrop-blur-md transition hover:border-[#ff7718] hover:text-[#ff8b32]"><RotateCcw className="h-4 w-4" /></button>
            <button type="button" onClick={() => setIsExpanded((value) => !value)} aria-label={isExpanded ? 'Minimize map' : 'Expand map'} className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#3a494b] bg-[#0c1416]/90 text-[#c4d0cd] backdrop-blur-md transition hover:border-[#ff7718] hover:text-[#ff8b32]">{isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          </div>

          {featuredShop && (
            <div className="absolute bottom-4 right-20 hidden w-[280px] items-center gap-3 rounded-[13px] border border-[#495355] bg-[#111a1c]/95 p-2.5 shadow-xl backdrop-blur-md lg:flex">
              <img src={featuredShop.imageUrl || STORE_THUMBNAIL} alt="" className="h-14 w-20 shrink-0 rounded-[8px] object-cover" />
              <div className="min-w-0 flex-1"><h3 className="truncate text-[14px] font-bold text-[#edf2ef]">{featuredShop.name}</h3><p className="mt-0.5 text-[11px] text-[#a9b4b1]">{featuredShop.distance ? `${featuredShop.distance.toFixed(1)} km away` : 'Nearby'} · <span className="text-[#f3b53d]">★ {featuredShop.rating.toFixed(1)}</span></p><p className="mt-1 text-[11px] text-[#39cb80]">20–30 min delivery</p><button type="button" onClick={() => navigate(`/shop/${featuredShop.id}`)} className="mt-2 w-full rounded-[8px] border border-[#d76e1a] py-1 text-[11px] font-bold text-[#ff8b32]">View store</button></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

const ChevronRightIcon = () => <span aria-hidden="true">›</span>;

export default MapSection;
