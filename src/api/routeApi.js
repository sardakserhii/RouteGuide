const API_BASE_URL = "http://localhost:3000/api";

export const fetchRouteData = async (from, to) => {
  // Backend expects "lat,lng"
  const fromStr = `${from[0]},${from[1]}`;
  const toStr = `${to[0]},${to[1]}`;
  
  const url = `${API_BASE_URL}/route?from=${fromStr}&to=${toStr}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Backend error " + res.status);
    }

    const data = await res.json();

    if (!data.geometry || !data.geometry.coordinates) {
      throw new Error("Маршрут не найден");
    }

    const coords = data.geometry.coordinates; // [ [lng, lat], ... ]

    // Конвертируем в [lat, lng] для Leaflet
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.warn("API request failed, using fallback route:", error);
    // Fallback: return a straight line between start and end
    return [from, to];
  }
};

export const fetchPoisData = async (bbox, route, filters = {}) => {
    // bbox: [minLat, maxLat, minLng, maxLng]
    // route: [[lat, lng], [lat, lng], ...]
    // filters: { categories, maxDistance, limit }
    const url = `${API_BASE_URL}/pois`;

    console.log('🔍 Fetching POIs via POST with filters:', filters);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bbox, route, filters })
        });
        
        if (!res.ok) {
            throw new Error("Backend error " + res.status);
        }
        const data = await res.json();
        
        // Handle new response format { pois, metadata } or fallback to array
        const pois = Array.isArray(data) ? data : (data.pois || []);
        const metadata = !Array.isArray(data) ? data.metadata : null;
        
        console.log('📍 POIs received:', pois.length, 'items');
        if (metadata) {
            console.log('📊 Metadata:', metadata);
        }
        
        return { pois, metadata };
    } catch (error) {
        console.error("Failed to fetch POIs:", error);
        return { pois: [], metadata: null };
    }
};

