import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Placeholder for API Key - User will replace this
const GEMINI_API_KEY = "AIzaSyCo4IFWwfoKUlcEauaMUQ8s1pT4k78g3fc";

interface PoisQuery {
  bbox: number[]; // [minLat, maxLat, minLng, maxLng]
  route?: number[][]; // [[lat, lng], ...]
  filters?: {
    categories?: string[]; // ['attraction', 'museum', 'viewpoint', 'monument', 'castle', 'artwork', 'historic']
    maxDistance?: number | null; // in kilometers, null = use automatic calculation
    limit?: number; // maximum number of POIs (default 50)
    useAi?: boolean; // Use AI for intelligent filtering
  };
}

// Helper function to calculate haversine distance between two points in km
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to find minimum distance from a point to a route (polyline)
function minDistanceToRoute(
  lat: number,
  lon: number,
  route: [number, number][]
): number {
  let minDist = Infinity;

  // Check distance to each line segment of the route
  for (let i = 0; i < route.length - 1; i++) {
    const [lat1, lon1] = route[i];
    const [lat2, lon2] = route[i + 1];

    // Calculate distance to the line segment
    const dist = pointToSegmentDistance(lat, lon, lat1, lon1, lat2, lon2);
    minDist = Math.min(minDist, dist);
  }

  return minDist;
}

// Helper function to calculate distance from a point to a line segment
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  // Calculate the distance from point (px, py) to line segment (x1, y1)-(x2, y2)
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return haversineDistance(px, py, xx, yy);
}

async function filterWithGemini(pois: any[]) {
  try {
    if (!GEMINI_API_KEY) {
      console.warn("Gemini API Key is missing. Skipping AI filtering.");
      return null;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Using gemini-1.5-flash-001 as specific version
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Preprocess data for AI: keep only essential fields
    const simplifiedPois = pois.map((p) => ({
      id: p.id,
      name: p.name,
      tags: p.tags,
      lat: p.lat,
      lon: p.lon,
    }));

    // Send in batches if too large, but for now let's try sending the top candidates
    // Limit input to AI to avoid token limits if list is huge.
    // Let's send top 30 candidates from the rough filter.
    const candidates = simplifiedPois.slice(0, 30);
    const dataStr = JSON.stringify(candidates);

    const prompt = `
    You are a tourism expert. I have a list of Points of Interest (POI) from OpenStreetMap.
    Select the top 5 most interesting places for a tourist. Ignore shops, banks, and boring administrative buildings.
    
    Return the answer STRICTLY in JSON format:
    [
        {
            "id": "id from source data",
            "name": "Name",
            "description": "Why it is worth visiting (1 sentence)"
        }
    ]
    
    Data:
    ${dataStr}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean markdown
    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const aiPois = JSON.parse(cleanText);
      return aiPois;
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return null;
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
}

export default async function poisRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    async (
      request: FastifyRequest<{ Body: PoisQuery }>,
      reply: FastifyReply
    ) => {
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

      // Parse bbox and route
      const [minLat, maxLat, minLng, maxLng] = bbox;
      let maxDeviation: number | null = null;
      let searchRadius = 5000; // Default search radius in meters for 'around' query

      if (route && route.length >= 2) {
        // Calculate distance between start and end points
        const [startLat, startLng] = route[0];
        const [endLat, endLng] = route[route.length - 1];
        const totalDistance = haversineDistance(
          startLat,
          startLng,
          endLat,
          endLng
        );

        // Use custom maxDistance if provided, otherwise use automatic calculation
        if (customMaxDistance !== undefined && customMaxDistance !== null) {
          maxDeviation = customMaxDistance;
          searchRadius = maxDeviation * 1000; // Convert km to meters
          fastify.log.info(
            `Using custom max deviation: ${maxDeviation.toFixed(2)} km`
          );
        } else {
          maxDeviation = totalDistance / 20; // Maximum deviation from route
          // Cap the auto deviation to reasonable limits (e.g. 5km min, 50km max)
          maxDeviation = Math.max(5, Math.min(maxDeviation, 50));
          searchRadius = maxDeviation * 1000;
          fastify.log.info(
            `Route distance: ${totalDistance.toFixed(
              2
            )} km, auto max deviation: ${maxDeviation.toFixed(2)} km`
          );
        }
      }

      // Build Overpass QL query dynamically based on selected categories
      const categoryQueries: string[] = [];

      // Helper to generate query part
      // If we have a route, use 'around' filter with sampled points
      // If no route, fall back to bbox
      let areaFilter = "";

      if (route && route.length > 0) {
        // Sample the route to avoid too long URL/query
        // Take every Nth point to keep total points reasonable (e.g. max 100 points)
        const step = Math.ceil(route.length / 50);
        const sampledPoints = route.filter((_, index) => index % step === 0);

        // Ensure start and end are included
        if (sampledPoints[0] !== route[0]) sampledPoints.unshift(route[0]);
        if (sampledPoints[sampledPoints.length - 1] !== route[route.length - 1])
          sampledPoints.push(route[route.length - 1]);

        // Construct 'around' filter: (around:radius, lat1, lon1, lat2, lon2, ...)
        // Note: Overpass 'around' with multiple points works as union of circles
        const coordsString = sampledPoints
          .map((p) => `${p[0]},${p[1]}`)
          .join(",");
        areaFilter = `(around:${searchRadius},${coordsString})`;

        fastify.log.info(
          `Using 'around' filter with ${sampledPoints.length} sampled points and radius ${searchRadius}m`
        );
      } else {
        // Fallback to bbox if no route provided
        areaFilter = `(${minLat},${minLng},${maxLat},${maxLng})`;
        fastify.log.info(`Using bbox filter: ${areaFilter}`);
      }

      // Map of category to Overpass queries
      // We inject the areaFilter into each query
      const categoryMap: Record<string, string[]> = {
        attraction: [`node["tourism"="attraction"]${areaFilter};`],
        museum: [`node["tourism"="museum"]${areaFilter};`],
        viewpoint: [`node["tourism"="viewpoint"]${areaFilter};`],
        monument: [
          `node["tourism"="monument"]${areaFilter};`,
          `node["historic"="monument"]${areaFilter};`,
        ],
        castle: [
          `node["tourism"="castle"]${areaFilter};`,
          `node["historic"="castle"]${areaFilter};`,
        ],
        artwork: [`node["tourism"="artwork"]${areaFilter};`],
        historic: [`node["historic"="memorial"]${areaFilter};`],
      };

      // Build query parts based on selected categories
      selectedCategories.forEach((category) => {
        if (categoryMap[category]) {
          categoryQueries.push(...categoryMap[category]);
        }
      });

      // If no categories selected, return empty result
      if (categoryQueries.length === 0) {
        fastify.log.info("No categories selected, returning empty result");
        return {
          pois: [],
          metadata: {
            total: 0,
            filtered: 0,
            filtersApplied: {
              categories: selectedCategories,
              maxDistance: maxDeviation,
              limit,
              useAi,
            },
          },
        };
      }

      // Construct Overpass QL query
      const query = `
      [out:json]
      [timeout:60]
      ;
      (
        ${categoryQueries.join("\n        ")}
      );
      out body;
    `;

      // fastify.log.info(`Overpass query: ${query}`);

      const overpassUrl = "https://overpass-api.de/api/interpreter";

      try {
        const params = new URLSearchParams();
        params.append("data", query);

        const response = await axios.post(overpassUrl, params, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "RouteGuide/1.0",
          },
          maxBodyLength: Infinity, // Allow large responses
          maxContentLength: Infinity,
        });

        const data = response.data;
        fastify.log.info(
          `Overpass response received. Elements: ${data.elements?.length || 0}`
        );

        if (!data.elements || data.elements.length === 0) {
          fastify.log.warn("No elements found in Overpass response");
        }

        const elements = data.elements || [];

        // Map Overpass elements to a simpler format
        let pois = elements.map((el: any) => ({
          id: el.id,
          type: el.type,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          name: el.tags?.name || "Unknown",
          tags: el.tags,
          tourism: el.tags?.tourism || el.tags?.historic,
          // Rank for sorting: named POIs are more important
          hasName: !!el.tags?.name,
        }));

        // Filter: only POIs with names
        pois = pois.filter((poi: any) => poi.hasName);

        // Filter by distance from route if route is provided (double check)
        // The 'around' filter is approximate (union of circles), so we might want to be strict
        if (route && maxDeviation) {
          pois = pois.filter((poi: any) => {
            const minDist = minDistanceToRoute(
              poi.lat,
              poi.lon,
              route as [number, number][]
            );
            return minDist <= maxDeviation!;
          });
          fastify.log.info(
            `After strict distance filtering: ${
              pois.length
            } POIs within ${maxDeviation.toFixed(2)} km of route`
          );
        }

        // Sort by importance (you can customize this logic)
        pois.sort((a: any, b: any) => {
          // Prioritize certain types
          const importantTypes = ["castle", "museum", "monument", "viewpoint"];
          const aImportant = importantTypes.includes(a.tourism);
          const bImportant = importantTypes.includes(b.tourism);

          if (aImportant && !bImportant) return -1;
          if (!aImportant && bImportant) return 1;
          return 0;
        });

        // AI Filtering Logic
        let aiFiltered = false;
        if (useAi && pois.length > 0) {
          fastify.log.info("Applying AI filtering...");
          const aiResults = await filterWithGemini(pois);

          if (aiResults && Array.isArray(aiResults)) {
            // Merge AI results with original POI data
            const mergedPois = aiResults
              .map((aiPoi: any) => {
                const original = pois.find((p: any) => p.id == aiPoi.id); // Loose equality for string/number mismatch
                if (original) {
                  return {
                    ...original,
                    description: aiPoi.description, // Add AI description
                    isTopPick: true,
                  };
                }
                return null;
              })
              .filter((p: any) => p !== null);

            if (mergedPois.length > 0) {
              pois = mergedPois;
              aiFiltered = true;
              fastify.log.info(
                `AI filtering successful. Returned ${pois.length} POIs.`
              );
            } else {
              fastify.log.warn(
                "AI returned results but matching failed or empty."
              );
            }
          } else {
            fastify.log.warn(
              "AI filtering failed or returned null. Falling back to standard filtering."
            );
          }
        }

        if (!aiFiltered) {
          // Limit to requested number of POIs if AI didn't filter
          pois = pois.slice(0, limit);
        }

        const totalFiltered = pois.length;

        fastify.log.info(
          `Returning ${pois.length} POIs to client (filtered from ${elements.length})`
        );

        return {
          pois,
          metadata: {
            total: elements.length,
            filtered: totalFiltered,
            filtersApplied: {
              categories: selectedCategories,
              maxDistance: maxDeviation,
              limit,
              useAi,
              aiApplied: aiFiltered,
            },
          },
        };
      } catch (error: any) {
        fastify.log.error("Overpass API error:", error.message);
        if (error.response) {
          fastify.log.error("Overpass response status:", error.response.status);
          fastify.log.error("Overpass response data:", error.response.data);
        }
        return reply
          .code(500)
          .send({ error: "Failed to fetch POIs from Overpass" });
      }
    }
  );
}
