import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';

interface PoisQuery {
  bbox: number[]; // [minLat, maxLat, minLng, maxLng]
  route?: number[][]; // [[lat, lng], ...]
  filters?: {
    categories?: string[]; // ['attraction', 'museum', 'viewpoint', 'monument', 'castle', 'artwork', 'historic']
    maxDistance?: number | null; // in kilometers, null = use automatic calculation
    limit?: number; // maximum number of POIs (default 50)
  };
}

// Helper function to calculate haversine distance between two points in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to find minimum distance from a point to a route (polyline)
function minDistanceToRoute(lat: number, lon: number, route: [number, number][]): number {
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
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
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

export default async function poisRoutes(fastify: FastifyInstance) {
  fastify.post('/', async (request: FastifyRequest<{ Body: PoisQuery }>, reply: FastifyReply) => {
    const { bbox, route, filters = {} } = request.body;

    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return reply.code(400).send({ error: 'Missing or invalid bbox parameter' });
    }

    // Extract filter parameters with defaults
    const selectedCategories = filters.categories || ['attraction', 'museum', 'viewpoint', 'monument', 'castle', 'artwork', 'historic'];
    const customMaxDistance = filters.maxDistance;
    const limit = filters.limit || 50;

    // Parse bbox and route
    const [minLat, maxLat, minLng, maxLng] = bbox;
    let maxDeviation: number | null = null;
    
    if (route && route.length >= 2) {
      // Calculate distance between start and end points
      const [startLat, startLng] = route[0];
      const [endLat, endLng] = route[route.length - 1];
      const totalDistance = haversineDistance(startLat, startLng, endLat, endLng);
      
      // Use custom maxDistance if provided, otherwise use automatic calculation
      if (customMaxDistance !== undefined && customMaxDistance !== null) {
        maxDeviation = customMaxDistance;
        fastify.log.info(`Using custom max deviation: ${maxDeviation.toFixed(2)} km`);
      } else {
        maxDeviation = totalDistance / 20; // Maximum deviation from route
        fastify.log.info(`Route distance: ${totalDistance.toFixed(2)} km, auto max deviation: ${maxDeviation.toFixed(2)} km`);
      }
    }

    // Calculate a smaller search area to avoid timeout
    // For very large routes, we'll limit the search to a narrower corridor
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxArea = 0.5; // Much smaller: 0.5 degrees (~55km)
    
    let searchMinLat = minLat;
    let searchMaxLat = maxLat;
    let searchMinLng = minLng;
    let searchMaxLng = maxLng;
    
    // If area is too large, shrink it to center portion
    if (latDiff > maxArea) {
      const center = (minLat + maxLat) / 2;
      searchMinLat = center - maxArea / 2;
      searchMaxLat = center + maxArea / 2;
      fastify.log.info(`Limiting latitude search from ${latDiff.toFixed(2)}° to ${maxArea}°`);
    }
    
    if (lngDiff > maxArea) {
      const center = (minLng + maxLng) / 2;
      searchMinLng = center - maxArea / 2;
      searchMaxLng = center + maxArea / 2;
      fastify.log.info(`Limiting longitude search from ${lngDiff.toFixed(2)}° to ${maxArea}°`);
    }

    fastify.log.info(`Search bounds: lat[${searchMinLat.toFixed(3)}, ${searchMaxLat.toFixed(3)}], lng[${searchMinLng.toFixed(3)}, ${searchMaxLng.toFixed(3)}]`);

    // Build Overpass QL query dynamically based on selected categories
    const categoryQueries: string[] = [];
    
    // Map of category to Overpass queries
    const categoryMap: Record<string, string[]> = {
      'attraction': [`node["tourism"="attraction"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`],
      'museum': [`node["tourism"="museum"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`],
      'viewpoint': [`node["tourism"="viewpoint"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`],
      'monument': [
        `node["tourism"="monument"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`,
        `node["historic"="monument"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`
      ],
      'castle': [
        `node["tourism"="castle"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`,
        `node["historic"="castle"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`
      ],
      'artwork': [`node["tourism"="artwork"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`],
      'historic': [`node["historic"="memorial"](${searchMinLat},${searchMinLng},${searchMaxLat},${searchMaxLng});`]
    };

    // Build query parts based on selected categories
    selectedCategories.forEach(category => {
      if (categoryMap[category]) {
        categoryQueries.push(...categoryMap[category]);
      }
    });

    // If no categories selected, return empty result
    if (categoryQueries.length === 0) {
      fastify.log.info('No categories selected, returning empty result');
      return {
        pois: [],
        metadata: {
          total: 0,
          filtered: 0,
          filtersApplied: {
            categories: selectedCategories,
            maxDistance: maxDeviation,
            limit
          }
        }
      };
    }

    // Construct Overpass QL query
    const query = `
      [out:json]
      [timeout:60]
      ;
      (
        ${categoryQueries.join('\n        ')}
      );
      out body;
    `;

    fastify.log.info(`Overpass query built with ${categoryQueries.length} category queries for categories: ${selectedCategories.join(', ')}`);

    const overpassUrl = 'https://overpass-api.de/api/interpreter';

    try {
      fastify.log.info(`Fetching POIs with bbox: ${bbox}`);
      
      const params = new URLSearchParams();
      params.append('data', query);

      const response = await axios.post(overpassUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RouteGuide/1.0' // Overpass requires a User-Agent
        }
      });

      const data = response.data;
      fastify.log.info(`Overpass response received. Elements: ${data.elements?.length || 0}`);
      
      if (!data.elements || data.elements.length === 0) {
        fastify.log.warn('No elements found in Overpass response');
        fastify.log.info({ response: data }, 'Overpass response data');
      } else {
        fastify.log.info({ element: data.elements[0] }, 'First element');
      }
      
      const elements = data.elements;
      
      // Map Overpass elements to a simpler format
      let pois = elements.map((el: any) => ({
        id: el.id,
        type: el.type,
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
        name: el.tags?.name || 'Unknown',
        tags: el.tags,
        tourism: el.tags?.tourism || el.tags?.historic,
        // Rank for sorting: named POIs are more important
        hasName: !!el.tags?.name
      }));

      // Filter: only POIs with names
      pois = pois.filter((poi: any) => poi.hasName);

      // Filter by distance from route if route is provided
      if (route && maxDeviation) {
        pois = pois.filter((poi: any) => {
          const minDist = minDistanceToRoute(poi.lat, poi.lon, route as [number, number][]);
          return minDist <= maxDeviation;
        });
        fastify.log.info(`After distance filtering: ${pois.length} POIs within ${maxDeviation.toFixed(2)} km of route`);
      }

      // Sort by importance (you can customize this logic)
      pois.sort((a: any, b: any) => {
        // Prioritize certain types
        const importantTypes = ['castle', 'museum', 'monument', 'viewpoint'];
        const aImportant = importantTypes.includes(a.tourism);
        const bImportant = importantTypes.includes(b.tourism);
        
        if (aImportant && !bImportant) return -1;
        if (!aImportant && bImportant) return 1;
        return 0;
      });

      // Limit to requested number of POIs
      const totalFiltered = pois.length;
      pois = pois.slice(0, limit);

      fastify.log.info(`Returning ${pois.length} POIs to client (filtered from ${elements.length})`);
      
      return {
        pois,
        metadata: {
          total: elements.length,
          filtered: totalFiltered,
          filtersApplied: {
            categories: selectedCategories,
            maxDistance: maxDeviation,
            limit
          }
        }
      };
    } catch (error: any) {
      fastify.log.error('Overpass API error:', error.message);
      if (error.response) {
        fastify.log.error('Overpass response status:', error.response.status);
        fastify.log.error('Overpass response data:', error.response.data);
      }
      return reply.code(500).send({ error: 'Failed to fetch POIs from Overpass' });
    }
  });
}
