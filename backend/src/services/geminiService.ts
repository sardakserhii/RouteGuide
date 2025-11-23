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
    for (
      let layer = 0;
      layer < maxGroup && diversified.length < limit;
      layer++
    ) {
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

  private calculateCategoryDistribution(
    pois: Poi[],
    totalTarget: number
  ): Record<string, number> {
    const categoryCounts: Record<string, number> = {};
    pois.forEach((p) => {
      const cat = p.category || "unknown";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categories = Object.keys(categoryCounts);
    if (categories.length === 0) return {};

    const targetPerCategory = Math.floor(totalTarget / categories.length);
    const distribution: Record<string, number> = {};
    let remainingSlots = totalTarget;

    // First pass: allocate base amount
    categories.forEach((cat) => {
      const available = categoryCounts[cat];
      const allocate = Math.min(available, targetPerCategory);
      distribution[cat] = allocate;
      remainingSlots -= allocate;
    });

    // Second pass: distribute remaining slots to categories that have availability
    while (remainingSlots > 0) {
      let allocatedInLoop = false;
      for (const cat of categories) {
        if (remainingSlots <= 0) break;
        if (distribution[cat] < categoryCounts[cat]) {
          distribution[cat]++;
          remainingSlots--;
          allocatedInLoop = true;
        }
      }
      if (!allocatedInLoop) break; // No more items available to fill slots
    }

    return distribution;
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
      const AI_CANDIDATE_POOL = 50; // Reduced from 80 for performance

      // Preprocess data for AI: keep only essential fields
      const diversifiedPois = this.diversifyPois(
        pois,
        route,
        AI_CANDIDATE_POOL
      );

      // Calculate desired distribution
      const distribution = this.calculateCategoryDistribution(
        diversifiedPois,
        AI_TARGET_RESULTS
      );
      const distributionPrompt = Object.entries(distribution)
        .map(([cat, count]) => `${count} ${cat}s`)
        .join(", ");

      // Optimize payload: minimal fields, no whitespace in JSON
      const simplifiedPois = diversifiedPois.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || "unknown",
        lat: Number(p.lat.toFixed(5)), // Reduce precision to save tokens
        lon: Number(p.lon.toFixed(5)),
      }));

      const dataStr = JSON.stringify(simplifiedPois); // Minified by default

      const prompt = `
      Select exactly ${AI_TARGET_RESULTS} stops for a road trip from the provided list.
      Target distribution: ${distributionPrompt}.
      Ensure they are spread along the route.
      Return JSON ONLY:
      [{"id": "id", "name": "name", "description": "Short reason (1 sentence)"}]
      
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
        mergedPois = this.diversifyPois(mergedPois, route, mergedPois.length);
      }

      return mergedPois;
    } catch (error) {
      console.error("Gemini API error:", error);
      return null;
    }
  }
}
