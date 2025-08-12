// Geolocation utility functions for hyperlocal delivery app

interface Shop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

/**
 * Filter shops by distance from user location
 * @param shops - Array of shop objects
 * @param userLocation - User location {lat, lng}
 * @param radiusKm - Radius in kilometers (default: 3)
 * @returns Filtered shops within radius
 */
export const filterShopsByDistance = (shops: Shop[], userLocation: UserLocation, radiusKm: number = 3): Shop[] => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    console.warn('Invalid user location provided');
    return [];
  }

  return shops.filter(shop => {
    if (!shop.latitude || !shop.longitude) {
      console.warn(`Shop ${shop.id || shop.name} missing coordinates`);
      return false;
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      shop.latitude,
      shop.longitude
    );

    // Add distance to shop object for potential use
    shop.distance = distance;
    
    return distance <= radiusKm;
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0)); // Sort by distance
};

/**
 * Calculate map bounds to fit shops within radius
 * @param shops - Array of shop objects
 * @param userLocation - User location {lat, lng}
 * @param radiusKm - Radius in kilometers (default: 3)
 * @returns Map bounds {north, south, east, west}
 */
export const calculateMapBounds = (shops: Shop[], userLocation: UserLocation, radiusKm: number = 3) => {
  if (!shops || shops.length === 0) {
    // Default bounds around user location
    const latOffset = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
    const lngOffset = radiusKm / (111 * Math.cos(userLocation.lat * Math.PI / 180));
    
    return {
      north: userLocation.lat + latOffset,
      south: userLocation.lat - latOffset,
      east: userLocation.lng + lngOffset,
      west: userLocation.lng - lngOffset
    };
  }

  const lats = shops.map(shop => shop.latitude);
  const lngs = shops.map(shop => shop.longitude);
  
  // Add user location to bounds calculation
  lats.push(userLocation.lat);
  lngs.push(userLocation.lng);

  const padding = 0.01; // Small padding for better view

  return {
    north: Math.max(...lats) + padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    west: Math.min(...lngs) - padding
  };
};

/**
 * Get optimal zoom level for map based on radius
 * @param radiusKm - Radius in kilometers
 * @returns Zoom level (1-18)
 */
export const getOptimalZoomLevel = (radiusKm: number = 3): number => {
  if (radiusKm <= 1) return 15;
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 20) return 11;
  return 10;
};

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}; 