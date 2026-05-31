import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, RotateCcw, Maximize2, Minimize2, Star, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { filterShopsByDistance } from '../utils/geoUtils.ts';

/* ─── Custom SVG Pin Makers ───────────────────────────────────────────────── */

const makePin = (bg: string, glyph: string, size = 38) =>
  L.divIcon({
    html: `<div style="
      width:${size}px;height:${size + 10}px;display:flex;flex-direction:column;align-items:center;
      filter:drop-shadow(0 2px 6px rgba(0,0,0,0.25));
    ">
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 6px;
        background:${bg};display:flex;align-items:center;justify-content:center;
        transform:rotate(45deg);border:2.5px solid rgba(255,255,255,0.9);
      "><div style="transform:rotate(-45deg);line-height:0">${glyph}</div></div>
      <div style="width:3px;height:6px;background:${bg};border-radius:0 0 2px 2px;margin-top:-2px"></div>
    </div>`,
    className: '',
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 10)],
  });

const shopPin = makePin(
  '#F97316',
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-6h16l1 6"/><path d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 2-2"/><path d="M5 21V11m14 10V11"/><rect x="9" y="14" width="6" height="7" rx="1"/></svg>`,
);

const userPin = makePin(
  '#6D28D9',
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" stroke="none"><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="3"/></svg>`,
  34,
);

/* ─── Tile URLs ───────────────────────────────────────────────────────────── */
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface Shop {
  id: string; name: string; latitude: number; longitude: number; rating: number;
  category: string; status: string; locationName: string; address?: string;
  phone?: string; distance?: number; deliveryAvailable?: boolean;
}
interface MapSectionProps {
  shops: Shop[];
  allShops: Shop[];
  userLocation: { lat: number; lng: number };
}

/* ─── Map event handler ───────────────────────────────────────────────────── */
const MapEventHandler: React.FC<{
  allShops: Shop[];
  userLocation: { lat: number; lng: number };
  onShopsUpdate: (shops: Shop[], total: number) => void;
}> = ({ allShops, userLocation, onShopsUpdate }) => {
  useMapEvents({
    zoomend: () => update(),
    moveend: () => update(),
  });
  function update() {
    // We just pass the allShops to parent for count display
    onShopsUpdate(allShops, allShops.length);
  }
  return null;
};

/* ─── Component ───────────────────────────────────────────────────────────── */
const MapSection: React.FC<MapSectionProps> = ({ shops, allShops, userLocation }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedShops, setDisplayedShops] = useState(shops);
  const [totalShopsCount, setTotalShopsCount] = useState(allShops.length);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const navigate = useNavigate();

  const handleShopsUpdate = useCallback((newShops: Shop[], total: number) => {
    setDisplayedShops(newShops);
    setTotalShopsCount(total);
  }, []);

  const handleReset = () => {
    if (mapRef) {
      mapRef.setView([userLocation.lat, userLocation.lng], 14);
      const nearby = filterShopsByDistance(allShops as any[], userLocation, 3);
      setDisplayedShops(nearby as any);
    }
  };

  // Tell Leaflet to recalculate container size after expand/collapse transition
  useEffect(() => {
    if (!mapRef) return;
    // Fire immediately for fast feedback, then again after CSS transition ends
    mapRef.invalidateSize({ animate: false });
    const t1 = setTimeout(() => mapRef.invalidateSize({ animate: false }), 50);
    const t2 = setTimeout(() => mapRef.invalidateSize({ animate: false }), 420);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isExpanded, mapRef]);

  // Pick tile URL based on theme
  const tileUrl = theme === 'dark' ? TILE_DARK : TILE_LIGHT;
  const isDark = theme === 'dark';

  return (
    <>
      {/* Expanded backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[59]"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={`qc-card overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'fixed top-20 left-4 right-4 bottom-4 z-[95] flex flex-col'
            : 'relative z-0'
        }`}
      >
        {/* Map header — always visible */}
        <div
          className="flex items-center justify-between px-4 py-3 relative z-[2] flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--pastel-sky)' }}
            >
              <Navigation className="h-4 w-4" style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h3 className="text-[14px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Shops Near You
              </h3>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {displayedShops.length} of {totalShopsCount} shops visible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold mr-2" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#6D28D9' }} />
                You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#F97316' }} />
                Shops
              </span>
            </div>

            <button
              onClick={handleReset}
              title="Reset view"
              className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: 'var(--pastel-sky)', color: '#3B82F6',
                border: '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Minimize' : 'Expand map'}
              className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: 'var(--pastel-peach)', color: 'var(--brand)',
                border: '1px solid var(--border-brand)',
              }}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isExpanded ? 'Minimize' : 'Expand'}</span>
            </button>
          </div>
        </div>

        {/* Map container */}
        <div className={`relative z-[1] ${isExpanded ? 'flex-1' : 'h-64 sm:h-72'}`}>
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            ref={setMapRef}
            zoomControl={false}
            className={isDark ? 'map-dark-mode' : ''}
          >
            {/* Voyager tile for both modes; CSS filter softens it for dark mode */}
            <TileLayer key={tileUrl} url={tileUrl} attribution={TILE_ATTR} maxZoom={20} />

            <MapEventHandler allShops={allShops} userLocation={userLocation} onShopsUpdate={handleShopsUpdate} />

            {/* User pin */}
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userPin}>
              <Popup>
                <div className="py-1 px-0.5 min-w-[160px]">
                  <p className="font-extrabold text-[13px] text-gray-900">📍 You are here</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Salt Lake City Center</p>
                </div>
              </Popup>
            </Marker>

            {/* Shop pins */}
            {displayedShops.map((shop: any) => (
              <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={shopPin}>
                <Popup>
                  <div className="py-1.5 min-w-[210px]">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="font-extrabold text-[13px] text-gray-900 leading-snug">{shop.name}</p>
                      <span className={`flex-none text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        shop.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {shop.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-1.5">{shop.locationName}</p>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Star className="h-3 w-3 fill-current" />{shop.rating}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] text-gray-500 font-medium">{shop.category}</span>
                    </div>
                    {shop.deliveryAvailable && (
                      <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-2">
                        🚀 Delivery Available
                      </p>
                    )}
                    <button
                      onClick={() => navigate(`/shop/${shop.id}`)}
                      className="w-full py-2 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
                      style={{ background: '#F97316' }}
                    >
                      View Shop →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MapSection;