import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PoiController } from "../backend/src/controllers/poiController";

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
    const controller = new PoiController();
    const result = await controller.getPois(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    if (error.message === "Missing or invalid bbox parameter") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch POIs" });
    }
  }
}
