import type { VercelRequest, VercelResponse } from "@vercel/node";
import { OverpassService } from "../backend/src/services/overpassService";

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

        const overpassService = new OverpassService();
        const pois = await overpassService.fetchPois(
            bbox,
            route,
            categories || [],
            maxDeviation || null,
            limit || 100
        );

        res.status(200).json({ pois });
    } catch (error: any) {
        console.error("POI API error:", error);
        res.status(500).json({ error: "Failed to fetch POIs" });
    }
}
