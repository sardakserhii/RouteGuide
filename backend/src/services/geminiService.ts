import { GoogleGenerativeAI } from "@google/generative-ai";
import { Poi } from "./overpassService";
import { haversineDistance } from "./geoService";
// import api key from .env
import dotenv from "dotenv";
dotenv.config();

export class GeminiService {
  private genAI: GoogleGenerativeAI | undefined;
  private model: any;

  private buildAnchors(
    route: [number, number][],
    targetAnchors: number
  ): [number, number][] {
    if (!route.length) return [];
    const step = Math.max(1, Math.floor(route.length / targetAnchors));
    const anchors: [number, number][] = [];

    for (let i = 0; i < route.length; i += step) {
      anchors.push(route[i] as [number, number]);
    }

    const last = route[route.length - 1] as [number, number];
    const lastAnchor = anchors[anchors.length - 1];
    if (!lastAnchor || lastAnchor[0] !== last[0] || lastAnchor[1] !== last[1]) {
      anchors.push(last);
    }

    return anchors;
  }

  /**
   * Spread POIs along the route so the AI sees evenly distributed candidates.
   */
  private diversifyPois(
    pois: Poi[],
    route: [number, number][] | undefined,
    limit: number
  ): Poi[] {
    if (!route || route.length === 0) {
      return pois.slice(0, limit);
    }

    const anchors = this.buildAnchors(
      route,
      Math.min(30, Math.max(10, Math.floor(route.length / 8)))
    );

    if (!anchors.length) {
      return pois.slice(0, limit);
    }

    const grouped: Poi[][] = anchors.map(() => []);

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

    const diversified: Poi[] = [];
    const maxGroup = Math.max(...grouped.map((g) => g.length));
    for (let layer = 0; layer < maxGroup && diversified.length < limit; layer++) {
      for (const group of grouped) {
        if (diversified.length >= limit) break;
        const candidate = group[layer];
        if (candidate) {
          diversified.push(candidate);
        }
      }
    }

    return diversified.slice(0, limit);
  }

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        "[GeminiService] GEMINI_API_KEY is not set. AI filtering will be disabled."
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }

  async filterPois(
    pois: Poi[],
    route?: [number, number][]
  ): Promise<Poi[] | null> {
    if (!this.genAI || !this.model) {
      console.warn(
        "Gemini API Key is missing or model not initialized. Skipping AI filtering."
      );
      return null;
    }

    try {
      const AI_TARGET_RESULTS = 10;
      const AI_CANDIDATE_POOL = 80;

      // Preprocess data for AI: keep only essential fields
      const diversifiedPois = this.diversifyPois(
        pois,
        route,
        AI_CANDIDATE_POOL
      );

      const simplifiedPois = diversifiedPois.map((p) => ({
        id: p.id,
        name: p.name,
        tags: {
          tourism: p.tags.tourism,
          historic: p.tags.historic,
          amenity: p.tags.amenity,
          description: p.tags.description,
        },
        lat: p.lat,
        lon: p.lon,
      }));

      const dataStr = JSON.stringify(simplifiedPois);

      const prompt = `
      You are curating highlights for a road trip. I have Points of Interest (POI) from OpenStreetMap with coordinates.
      Pick ${AI_TARGET_RESULTS} places that are worth a stop AND keep them spread along the whole route
      (avoid choosing many items in the same town). Prefer unique, historic, or visually impressive locations;
      only pick shops/banks if they are famous landmarks.
      
      Return the answer STRICTLY in JSON format:
      [
          {
              "id": "id from source data (keep as number or string exactly as input)",
              "name": "Name",
              "description": "Why it is worth visiting (1-2 sentences). Mention specific details if available."
          }
      ]
      
      Data:
      ${dataStr}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean markdown
      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const aiPois = JSON.parse(cleanText);

      // Merge AI results with original POI data
      let mergedPois = aiPois
        .map((aiPoi: any) => {
          const original = pois.find((p) => p.id == aiPoi.id);
          if (original) {
            return {
              ...original,
              description: aiPoi.description,
              isTopPick: true,
            };
          }
          return null;
        })
        .filter((p: any) => p !== null);

      if (route && mergedPois.length > 0) {
        mergedPois = this.diversifyPois(
          mergedPois,
          route,
          mergedPois.length
        );
      }

      return mergedPois;
    } catch (error) {
      console.error("Gemini API error:", error);
      return null;
    }
  }
}
