import { FastifyRequest, FastifyReply } from "fastify";
import { OverpassService } from "../services/overpassService";
import { GeminiService } from "../services/geminiService";
import { TilePoisService } from "../services/tilePoisService";
import { haversineDistance, minDistanceToRoute } from "../services/geoService";
import { getTilesForRoute } from "../utils/tiles";
import { Poi } from "../services/overpassService";

interface PoisQuery {
  bbox: number[]; // [minLat, maxLat, minLng, maxLng]
  route?: number[][]; // [[lat, lng], ...]
  filters?: {
    categories?: string[];
    maxDistance?: number | null; // in kilometers
    limit?: number;
    useAi?: boolean;
    useTileCache?: boolean; // New flag to enable tile-based caching
  };
}

export class PoiController {
  private overpassService: OverpassService;
  private geminiService: GeminiService;
  private tilePoisService: TilePoisService;

  constructor() {
    this.overpassService = new OverpassService();
    this.geminiService = new GeminiService();
    this.tilePoisService = new TilePoisService();
  }

  /**
   * Pick POIs evenly along the route so dense areas near start/end don't dominate.
   */
  private stratifyPoisAlongRoute(
    pois: Poi[],
    route: [number, number][],
    limit: number
  ): Poi[] {
    if (!route.length || limit <= 0) return [];

    // Build anchor points along the route (sampled vertices)
    const targetAnchors = Math.min(30, Math.max(10, Math.floor(route.length / 8)));
    const step = Math.max(1, Math.floor(route.length / targetAnchors));

    const anchors: [number, number][] = [];
    for (let i = 0; i < route.length; i += step) {
      anchors.push(route[i] as [number, number]);
    }
    // Ensure the end point is included
    const last = route[route.length - 1] as [number, number];
    const lastAnchor = anchors[anchors.length - 1];
    if (!lastAnchor || lastAnchor[0] !== last[0] || lastAnchor[1] !== last[1]) {
      anchors.push(last);
    }

    const grouped: Poi[][] = anchors.map(() => []);

    // Assign each POI to the nearest anchor; keep existing priority order inside the group
    for (const poi of pois) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      anchors.forEach(([alat, alon], idx) => {
        const d = haversineDistance(poi.lat, poi.lon, alat, alon);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = idx;
        }
      });

      grouped[nearestIdx].push(poi);
    }

    // Round-robin take from each anchor group to distribute results
    const stratified: Poi[] = [];
    const maxGroup = Math.max(...grouped.map((g) => g.length));
    for (let layer = 0; layer < maxGroup && stratified.length < limit; layer++) {
      for (const group of grouped) {
        if (stratified.length >= limit) break;
        const candidate = group[layer];
        if (candidate) {
          stratified.push(candidate);
        }
      }
    }

    return stratified.slice(0, limit);
  }

  async getPois(
    request: FastifyRequest<{ Body: PoisQuery }>,
    reply: FastifyReply
  ) {
    const { bbox, route, filters = {} } = request.body;

    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return reply
        .code(400)
        .send({ error: "Missing or invalid bbox parameter" });
    }

    // Extract filter parameters with defaults
    const selectedCategories = filters.categories || [
      "attraction",
      "museum",
      "viewpoint",
      "monument",
      "castle",
      "artwork",
      "historic",
    ];
    const customMaxDistance = filters.maxDistance;
    const limit = filters.limit || 50;
    const useAi = filters.useAi || false;
    const useTileCache = filters.useTileCache !== false; // Default to true

    // Get configuration from environment
    const MAX_POIS = parseInt(process.env.MAX_POIS || "1000", 10);
    const POI_CACHE_TTL_DAYS = parseInt(
      process.env.POI_CACHE_TTL_DAYS || "7",
      10
    );

    // Calculate max deviation
    let maxDeviation: number | null = null;
    if (route && route.length >= 2) {
      const [startLat, startLng] = route[0];
      const [endLat, endLng] = route[route.length - 1];
      const totalDistance = haversineDistance(
        startLat,
        startLng,
        endLat,
        endLng
      );

      if (customMaxDistance !== undefined && customMaxDistance !== null) {
        maxDeviation = customMaxDistance;
      } else {
        maxDeviation = totalDistance / 20;
        maxDeviation = Math.max(5, Math.min(maxDeviation, 50));
      }
    }

    try {
      let pois: Poi[] = [];

      // Use tile-based caching if enabled and route is provided
      if (useTileCache && route && route.length > 0 && maxDeviation) {
        console.log("[PoiController] Using tile-based caching");

        // Get configuration from environment
        const OVERPASS_REQUEST_DELAY_MS = parseInt(
          process.env.OVERPASS_REQUEST_DELAY_MS || "500",
          10
        );
        const PARALLEL_REQUESTS = 3; // Number of endpoints we have

        // Get tiles for route
        const tiles = getTilesForRoute(route, maxDeviation);
        console.log(`[PoiController] Route covers ${tiles.length} tiles`);

        // Fetch POIs for tiles in parallel batches
        const allPois: Poi[] = [];

        // Process tiles in batches of PARALLEL_REQUESTS
        for (let i = 0; i < tiles.length; i += PARALLEL_REQUESTS) {
          const batch = tiles.slice(i, i + PARALLEL_REQUESTS);

          // Add delay before each batch (except first)
          if (i > 0 && OVERPASS_REQUEST_DELAY_MS > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, OVERPASS_REQUEST_DELAY_MS)
            );
          }

          // Load tiles in parallel within batch
          const batchPromises = batch.map((tile) =>
            this.tilePoisService
              .loadTilePois(
                tile,
                { categories: selectedCategories, maxDistance: maxDeviation },
                { ttlDays: POI_CACHE_TTL_DAYS, requestDelay: 0 } // No delay within batch
              )
              .catch((error: any) => {
                console.error(
                  `[PoiController] Error loading tile ${tile.id}:`,
                  error.message
                );
                return []; // Return empty array on error, don't fail entire batch
              })
          );

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach((tilePois) => allPois.push(...tilePois));

          console.log(
            `[PoiController] Processed batch ${
              Math.floor(i / PARALLEL_REQUESTS) + 1
            }/${Math.ceil(tiles.length / PARALLEL_REQUESTS)} (${
              batch.length
            } tiles)`
          );
        }

        // Deduplicate POIs by osm_id
        const poiMap = new Map<number, Poi>();
        for (const poi of allPois) {
          if (!poiMap.has(poi.id)) {
            poiMap.set(poi.id, poi);
          }
        }
        pois = Array.from(poiMap.values());
        console.log(
          `[PoiController] Deduplication: ${allPois.length} -> ${pois.length} POIs`
        );

        // Filter by actual distance to route
        if (route && maxDeviation) {
          pois = pois.map((poi) => {
            const distance = minDistanceToRoute(
              poi.lat,
              poi.lon,
              route as [number, number][]
            );
            return { ...poi, distance };
          });

          pois = pois.filter((poi) => (poi.distance || 0) <= maxDeviation);
          console.log(
            `[PoiController] Distance filtering: ${pois.length} POIs within ${maxDeviation}km`
          );
        }

        // Sort by importance and distance
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

          // If same importance, sort by distance
          return (a.distance || 0) - (b.distance || 0);
        });
      } else {
        // Fallback to old method (direct Overpass query)
        console.log("[PoiController] Using direct Overpass query");
        pois = await this.overpassService.fetchPois(
          bbox,
          route,
          selectedCategories,
          maxDeviation,
          limit * 2
        );
      }

      const totalFiltered = pois.length;
      const truncated = pois.length > MAX_POIS;

      // Limit to MAX_POIS
      if (truncated) {
        pois = pois.slice(0, MAX_POIS);
      }

      let aiFiltered = false;

      // Apply AI filtering if requested
      if (useAi && pois.length > 0) {
        const aiResults = await this.geminiService.filterPois(
          pois,
          route as [number, number][] | undefined
        );
        if (aiResults && aiResults.length > 0) {
          pois = aiResults;
          aiFiltered = true;
        }
      }

      // Apply user limit if not AI filtered
      if (!aiFiltered && pois.length > limit) {
        if (route && route.length > 0) {
          pois = this.stratifyPoisAlongRoute(
            pois,
            route as [number, number][],
            limit
          );
        } else {
          pois = pois.slice(0, limit);
        }
      }

      return {
        pois,
        metadata: {
          total: totalFiltered,
          filtered: pois.length,
          truncated,
          filtersApplied: {
            categories: selectedCategories,
            maxDistance: maxDeviation,
            limit,
            useAi,
            aiApplied: aiFiltered,
            useTileCache,
          },
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({ error: "Failed to fetch POIs" });
    }
  }
}
