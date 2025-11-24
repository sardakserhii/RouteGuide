import db from "./database";
import { Poi } from "../services/overpassService";

export class PoisRepository {
  async upsertPoi(poi: Poi): Promise<void> {
    await db.upsertPoi(poi);
  }

  async getPoiById(id: string): Promise<Poi | null> {
    return await db.getPoiById(id);
  }

  async getPoisByIds(ids: string[]): Promise<Poi[]> {
    return await db.getPoisByIds(ids);
  }
}
