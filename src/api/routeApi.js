const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000/api" : "/api")
).replace(/\/$/, "");

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
      throw new Error("Route was not returned by the backend");
    }

    const coords = data.geometry.coordinates; // [ [lng, lat], ... ]

    // Convert to [lat, lng] for Leaflet
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch (error) {
    console.error("Failed to fetch route:", error);
    throw new Error(
      error?.message || "Unable to fetch route. Please try again later."
    );
  }
};

export const fetchPoisData = async (bbox, route, filters = {}) => {
  // bbox: [minLat, maxLat, minLng, maxLng]
  // route: [[lat, lng], [lat, lng], ...]
  // filters: { categories, maxDistance, limit }
  const url = `${API_BASE_URL}/pois`;

  console.log("[POI] Fetching via POST with filters:", filters);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bbox, route, filters }),
    });

    if (!res.ok) {
      throw new Error("Backend error " + res.status);
    }
    const data = await res.json();

    // Handle new response format { pois, metadata } or fallback to array
    const pois = Array.isArray(data) ? data : data.pois || [];
    const metadata = !Array.isArray(data) ? data.metadata : null;

    console.log("[POI] Received:", pois.length, "items");
    if (metadata) {
      console.log("[POI] Metadata:", metadata);
    }

    return { pois, metadata };
  } catch (error) {
    console.error("Failed to fetch POIs:", error);
    return { pois: [], metadata: null };
  }
};
