import { GoogleGenerativeAI } from "@google/generative-ai";
import { Poi } from "./overpassService";
// import api key from .env
import dotenv from "dotenv";
dotenv.config();

export class GeminiService {
  private genAI: GoogleGenerativeAI | undefined;
  private model: any;

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

  async filterPois(pois: Poi[]): Promise<Poi[] | null> {
    if (!this.genAI || !this.model) {
      console.warn(
        "Gemini API Key is missing or model not initialized. Skipping AI filtering."
      );
      return null;
    }

    try {
      // Preprocess data for AI: keep only essential fields
      const simplifiedPois = pois.map((p) => ({
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

      // Limit input to AI to avoid token limits
      // Send top 50 candidates
      const candidates = simplifiedPois.slice(0, 50);
      const dataStr = JSON.stringify(candidates);

      const prompt = `
      You are a tourism expert. I have a list of Points of Interest (POI) from OpenStreetMap.
      Select the top 10 most interesting places for a tourist. 
      Ignore generic shops, banks, and boring administrative buildings unless they are famous landmarks.
      Prioritize unique, historic, or visually stunning locations.
      
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
      const mergedPois = aiPois
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

      return mergedPois;
    } catch (error) {
      console.error("Gemini API error:", error);
      return null;
    }
  }
}
