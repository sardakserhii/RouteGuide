// Geocoding service using Nominatim API
// Free tier: 1 request per second limit

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const RATE_LIMIT_MS = 1000; // 1 request per second
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for geocoding results
const geocodeCache = new Map();
let lastRequestTime = 0;

/**
 * Throttle requests to respect Nominatim rate limits
 * @returns {Promise<void>}
 */
async function throttle() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Generate cache key from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string}
 */
function getCacheKey(lat, lng) {
  // Round to 4 decimal places (~11m precision) for cache hits
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Check if cached result is still valid
 * @param {object} cacheEntry
 * @returns {boolean}
 */
function isCacheValid(cacheEntry) {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION_MS;
}

/**
 * Reverse geocode coordinates to human-readable address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Human-readable location name
 */
export async function reverseGeocode(lat, lng) {
  const cacheKey = getCacheKey(lat, lng);
  
  // Check cache first
  const cached = geocodeCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.displayName;
  }
  
  try {
    // Respect rate limits
    await throttle();
    
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: '10', // City/town level
      'accept-language': 'en'
    });
    
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': 'RouteGuide/1.0 (Contact: your-email@example.com)' // Required by Nominatim usage policy
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the most relevant location name
    let displayName;
    if (data.address) {
      const { city, town, village, county, state, country } = data.address;
      // Prefer city/town, fallback to county/state
      const locality = city || town || village || county || state;
      displayName = locality ? `${locality}, ${country}` : country || data.display_name;
    } else {
      displayName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    
    // Cache the result
    geocodeCache.set(cacheKey, {
      displayName,
      timestamp: Date.now()
    });
    
    return displayName;
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to coordinates
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/**
 * Clear expired cache entries (optional cleanup)
 */
export function cleanupCache() {
  for (const [key, value] of geocodeCache.entries()) {
    if (!isCacheValid(value)) {
      geocodeCache.delete(key);
    }
  }
}
