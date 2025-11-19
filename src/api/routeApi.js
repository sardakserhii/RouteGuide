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

export const fetchPoisData = async (bbox, route) => {
    // bbox: [minLat, maxLat, minLng, maxLng]
    // route: [[lat, lng], [lat, lng], ...]
    const url = `${API_BASE_URL}/pois`;

    console.log('🔍 Fetching POIs via POST');

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bbox, route })
        });
        
        if (!res.ok) {
            throw new Error("Backend error " + res.status);
        }
        const data = await res.json();
        console.log('📍 POIs received:', data?.length || 0, 'items');
        console.log('📍 First POI:', data?.[0]);
        return data;
    } catch (error) {
        console.error("Failed to fetch POIs:", error);
        return [];
    }
};

