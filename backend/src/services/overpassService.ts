import axios from "axios";
import { CATEGORY_MAPPINGS } from "../config/categories";
import { minDistanceToRoute } from "./geoService";

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface Poi {
  id: number;
  type: string;
  lat: number;
  lon: number;
  name: string;
  tags: Record<string, string>;
  tourism: string;
  hasName: boolean;
  distance?: number;
  description?: string;
  isTopPick?: boolean;
}

export class OverpassService {
  private overpassEndpoints: string[];
  private currentEndpointIndex: number = 0;
  private maxRetries = parseInt(process.env.OVERPASS_MAX_RETRIES || "3", 10);
  private retryDelayMs = parseInt(
    process.env.OVERPASS_RETRY_DELAY_MS || "2000",
    10
  );

  constructor() {
    // Load endpoints from environment or use defaults
    const endpointsEnv = process.env.OVERPASS_ENDPOINTS;
    if (endpointsEnv) {
      this.overpassEndpoints = endpointsEnv.split(",").map((e) => e.trim());
    } else {
      // Default public Overpass API endpoints (verified working)
      this.overpassEndpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
      ];
    }
    console.log(
      `[OverpassService] Initialized with ${this.overpassEndpoints.length} endpoints`
    );
  }

  /**
   * Get the next endpoint in rotation (round-robin)
   */
  private getNextEndpoint(): string {
    const endpoint = this.overpassEndpoints[this.currentEndpointIndex];
    this.currentEndpointIndex =
      (this.currentEndpointIndex + 1) % this.overpassEndpoints.length;
    return endpoint;
  }

  /**
   * Retry helper with exponential backoff and endpoint rotation
   */
  private async retryWithBackoff<T>(
    fn: (endpoint: string) => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;
    let endpointAttempts = new Set<string>();

    for (let attempt = 0; attempt <= retries; attempt++) {
      // Get next endpoint (rotates on each attempt)
      const endpoint = this.getNextEndpoint();
      endpointAttempts.add(endpoint);

      try {
        console.log(
          `[OverpassService] Attempt ${attempt + 1}/${
            retries + 1
          } using ${endpoint}`
        );
        return await fn(endpoint);
      } catch (error: any) {
        lastError = error;

        // Don't retry on non-retryable errors
        if (
          error.response &&
          error.response.status !== 429 &&
          error.response.status !== 503 &&
          error.response.status !== 504
        ) {
          throw error;
        }

        // If this was the last attempt, throw
        if (attempt >= retries) {
          console.error(
            `[OverpassService] All retry attempts failed. Tried endpoints: ${Array.from(
              endpointAttempts
            ).join(", ")}`
          );
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = this.retryDelayMs * Math.pow(2, attempt);
        console.log(
          `[OverpassService] Request failed (status ${error.response?.status}), retrying in ${delay}ms with different endpoint...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  async fetchPois(
    bbox: number[],
    route: number[][] | undefined,
    categories: string[],
    maxDeviation: number | null,
    limit: number
  ): Promise<Poi[]> {
    const [minLat, maxLat, minLng, maxLng] = bbox;
    let areaFilter = "";
    let searchRadius = 5000;

    if (route && route.length > 0) {
      if (maxDeviation) {
        searchRadius = maxDeviation * 1000;
      }

      // Adaptive sampling:
      // Target roughly 50-100 points for the 'around' filter to keep query size manageable
      // but ensure we cover the whole route.
      const targetPoints = 80;
      const step = Math.max(1, Math.ceil(route.length / targetPoints));

      const sampledPoints = route.filter((_, index) => index % step === 0);

      // Ensure start and end are included
      if (sampledPoints[0] !== route[0]) sampledPoints.unshift(route[0]);
      if (sampledPoints[sampledPoints.length - 1] !== route[route.length - 1])
        sampledPoints.push(route[route.length - 1]);

      const coordsString = sampledPoints
        .map((p) => `${p[0]},${p[1]}`)
        .join(",");
      areaFilter = `(around:${searchRadius},${coordsString})`;

      console.log(
        `Overpass: Using 'around' filter with ${sampledPoints.length} points (step ${step}) and radius ${searchRadius}m`
      );
    } else {
      areaFilter = `(${minLat},${minLng},${maxLat},${maxLng})`;
      console.log(`Overpass: Using bbox filter: ${areaFilter}`);
    }

    const categoryQueries: string[] = [];
    categories.forEach((category) => {
      if (CATEGORY_MAPPINGS[category]) {
        // Inject areaFilter into each query part
        // The mapping strings are like 'node["tourism"="attraction"]'
        // We need to append the areaFilter before the semicolon/end
        const queries = CATEGORY_MAPPINGS[category].map(
          (q) => `${q}${areaFilter};`
        );
        categoryQueries.push(...queries);
      }
    });

    if (categoryQueries.length === 0) {
      return [];
    }

    const query = `
      [out:json]
      [timeout:90]
      ;
      (
        ${categoryQueries.join("\n        ")}
      );
      out body;
    `;

    // Use retry logic for the request with endpoint rotation
    return this.retryWithBackoff(async (endpoint: string) => {
      try {
        const params = new URLSearchParams();
        params.append("data", query);

        const response = await axios.post(endpoint, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "RouteGuide/1.0",
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        const data = response.data;
        const elements: OverpassElement[] = data.elements || [];

        let pois = elements.map((el) => ({
          id: el.id,
          type: el.type,
          lat: el.lat || el.center?.lat || 0,
          lon: el.lon || el.center?.lon || 0,
          name: el.tags?.name || "Unknown",
          tags: el.tags || {},
          tourism:
            el.tags?.tourism ||
            el.tags?.historic ||
            el.tags?.amenity ||
            el.tags?.shop ||
            el.tags?.natural ||
            "unknown",
          hasName: !!el.tags?.name,
        }));

        // Filter: only POIs with names
        pois = pois.filter((poi) => poi.hasName);

        // Strict distance filtering if route is provided
        if (route && maxDeviation) {
          pois = pois.filter((poi) => {
            const minDist = minDistanceToRoute(
              poi.lat,
              poi.lon,
              route as [number, number][]
            );
            return minDist <= maxDeviation;
          });
        }

        // Sort by importance (simple heuristic)
        pois.sort((a, b) => {
          const importantTypes = [
            "castle",
            "museum",
            "monument",
            "viewpoint",
            "attraction",
          ];
          const aImportant = importantTypes.includes(a.tourism);
          const bImportant = importantTypes.includes(b.tourism);

          if (aImportant && !bImportant) return -1;
          if (!aImportant && bImportant) return 1;
          return 0;
        });

        return pois;
      } catch (error: any) {
        console.error("Overpass API error:", error.message);
        if (error.response) {
          console.error("Overpass response status:", error.response.status);
          console.error("Overpass response data:", error.response.data);
        }
        throw new Error("Failed to fetch POIs from Overpass");
      }
    });
  }
}
