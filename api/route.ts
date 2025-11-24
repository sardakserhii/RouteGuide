import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { from, to } = req.query;

    if (!from || !to || typeof from !== "string" || typeof to !== "string") {
        res.status(400).json({
            error: "Missing or invalid from/to parameters",
        });
        return;
    }

    const [fromLat, fromLng] = from.split(",");
    const [toLat, toLng] = to.split(",");

    if (!fromLat || !fromLng || !toLat || !toLng) {
        res.status(400).json({
            error: "Invalid coordinates format. Use lat,lng",
        });
        return;
    }

    // OSRM expects "lng,lat"
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);

        if (!response.ok) {
            console.error(
                `OSRM API error: ${response.status} ${response.statusText}`
            );
            res.status(502).json({ error: "Failed to fetch route from OSRM" });
            return;
        }

        const data: any = await response.json();
        const route = data.routes?.[0];

        if (!route) {
            res.status(404).json({ error: "No route found" });
            return;
        }

        res.status(200).json({
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry,
        });
    } catch (error) {
        console.error("Route API error:", error);
        res.status(500).json({ error: "Failed to fetch route from OSRM" });
    }
}
