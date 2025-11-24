import type { VercelRequest, VercelResponse } from "@vercel/node";

// Category mappings
const CATEGORY_MAPPINGS: Record<string, string[]> = {
    attraction: [
        'node["tourism"="attraction"]',
        'way["tourism"="attraction"]',
        'relation["tourism"="attraction"]',
    ],
    museum: ['node["tourism"="museum"]', 'way["tourism"="museum"]'],
    viewpoint: ['node["tourism"="viewpoint"]'],
    hotel: ['node["tourism"="hotel"]', 'way["tourism"="hotel"]'],
    monument: [
        'node["tourism"="monument"]',
        'node["historic"="monument"]',
        'way["historic"="monument"]',
    ],
    memorial: ['node["historic"="memorial"]', 'way["historic"="memorial"]'],
    castle: ['node["historic"="castle"]', 'way["historic"="castle"]'],
    ruins: ['node["historic"="ruins"]', 'way["historic"="ruins"]'],
    peak: ['node["natural"="peak"]'],
    beach: ['node["natural"="beach"]', 'way["natural"="beach"]'],
    park: ['node["leisure"="park"]', 'way["leisure"="park"]'],
    restaurant: ['node["amenity"="restaurant"]', 'way["amenity"="restaurant"]'],
    cafe: ['node["amenity"="cafe"]', 'way["amenity"="cafe"]'],
};

// Helper: determine category from tags
function determineCategory(tags: Record<string, string> | undefined): string {
    if (!tags) return "other";
    for (const [category, queries] of Object.entries(CATEGORY_MAPPINGS)) {
        for (const query of queries) {
            const match = query.match(/\["([^"]+)"="([^"]+)"\]/);
            if (match) {
                const key = match[1];
                const value = match[2];
                if (tags[key] === value) {
                    return category;
                }
            }
        }
    }
    return "other";
}

// Helper: haversine distance
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371;
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

// Helper: minimum distance to route
function minDistanceToRoute(
    lat: number,
    lon: number,
    route: [number, number][]
): number {
    let minDist = Infinity;
    for (let i = 0; i < route.length - 1; i++) {
        const [lat1, lon1] = route[i];
        const [lat2, lon2] = route[i + 1];
        const A = lat - lat1;
        const B = lon - lon1;
        const C = lat2 - lat1;
        const D = lon2 - lon1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        let xx, yy;
        if (param < 0) {
            xx = lat1;
            yy = lon1;
        } else if (param > 1) {
            xx = lat2;
            yy = lon2;
        } else {
            xx = lat1 + param * C;
            yy = lon1 + param * D;
        }
        const dist = haversineDistance(lat, lon, xx, yy);
        minDist = Math.min(minDist, dist);
    }
    return minDist;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,OPTIONS,PATCH,DELETE,POST,PUT"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const { bbox, route, categories, maxDeviation, limit } = req.body;

        if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
            res.status(400).json({
                error: "Missing or invalid bbox parameter",
            });
            return;
        }

        // Fetch POIs using Overpass API
        const [minLat, maxLat, minLng, maxLng] = bbox;
        let areaFilter = "";
        let searchRadius = 5000;

        if (route && route.length > 0) {
            if (maxDeviation) {
                searchRadius = maxDeviation * 1000;
            }
            const targetPoints = 80;
            const step = Math.max(1, Math.ceil(route.length / targetPoints));
            const sampledPoints = route.filter(
                (_: any, index: number) => index % step === 0
            );
            if (sampledPoints[0] !== route[0]) sampledPoints.unshift(route[0]);
            if (
                sampledPoints[sampledPoints.length - 1] !==
                route[route.length - 1]
            )
                sampledPoints.push(route[route.length - 1]);
            const coordsString = sampledPoints
                .map((p: number[]) => `${p[0]},${p[1]}`)
                .join(",");
            areaFilter = `(around:${searchRadius},${coordsString})`;
        } else {
            areaFilter = `(${minLat},${minLng},${maxLat},${maxLng})`;
        }

        const categoryQueries: string[] = [];
        categories.forEach((category: string) => {
            if (CATEGORY_MAPPINGS[category]) {
                const queries = CATEGORY_MAPPINGS[category].map(
                    (q) => `${q}${areaFilter};`
                );
                categoryQueries.push(...queries);
            }
        });

        if (categoryQueries.length === 0) {
            res.status(200).json({ pois: [] });
            return;
        }

        const query = `
[out:json]
[timeout:90]
;
(
  ${categoryQueries.join("\n  ")}
);
out center;
`;

        const endpoint = "https://overpass-api.de/api/interpreter";
        const params = new URLSearchParams();
        params.append("data", query);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "RouteGuide/1.0",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();
        const elements = data.elements || [];

        let pois = elements.map((el: any) => ({
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
            category: determineCategory(el.tags),
            hasName: !!el.tags?.name,
        }));

        // Filter: only POIs with names
        pois = pois.filter((poi: any) => poi.hasName);

        // Strict distance filtering if route is provided
        if (route && maxDeviation) {
            pois = pois.filter((poi: any) => {
                const minDist = minDistanceToRoute(
                    poi.lat,
                    poi.lon,
                    route as [number, number][]
                );
                return minDist <= maxDeviation;
            });
        }

        // Sort by importance
        const importantTypes = [
            "castle",
            "museum",
            "monument",
            "viewpoint",
            "attraction",
        ];
        pois.sort((a: any, b: any) => {
            const aImportant = importantTypes.includes(a.tourism);
            const bImportant = importantTypes.includes(b.tourism);
            if (aImportant && !bImportant) return -1;
            if (!aImportant && bImportant) return 1;
            return 0;
        });

        res.status(200).json({ pois: pois.slice(0, limit || 100) });
    } catch (error: any) {
        console.error("POI API error:", error);
        res.status(500).json({ error: "Failed to fetch POIs" });
    }
}
