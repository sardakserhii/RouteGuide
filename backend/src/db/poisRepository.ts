import db from "./database";
import { Poi } from "../services/overpassService";
import { determineCategory } from "../config/categories";

export interface DbPoi {
  id: string;
  osm_type: string;
  osm_id: number;
  lat: number;
  lon: number;
  tags: string;
  updated_at: string;
}

export class PoisRepository {
  upsertPoi(poi: Poi): void {
    const stmt = db.prepare(`
      INSERT INTO pois (id, osm_type, osm_id, lat, lon, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        lat = excluded.lat,
        lon = excluded.lon,
        tags = excluded.tags,
        updated_at = excluded.updated_at
    `);

    const id = `${poi.type}/${poi.id}`;
    const tags = JSON.stringify(poi.tags);
    const now = new Date().toISOString();

    stmt.run(id, poi.type, poi.id, poi.lat, poi.lon, tags, now);
  }

  getPoiById(id: string): Poi | null {
    const stmt = db.prepare("SELECT * FROM pois WHERE id = ?");
    const row = stmt.get(id) as DbPoi | undefined;

    if (!row) return null;

    return this.dbPoiToPoi(row);
  }

  getPoisByIds(ids: string[]): Poi[] {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const stmt = db.prepare(`SELECT * FROM pois WHERE id IN (${placeholders})`);
    const rows = stmt.all(...ids) as DbPoi[];

    return rows.map(this.dbPoiToPoi);
  }

  private dbPoiToPoi(row: DbPoi): Poi {
    const tags = JSON.parse(row.tags);
    return {
      id: row.osm_id,
      type: row.osm_type,
      lat: row.lat,
      lon: row.lon,
      name: tags.name || "Unknown",
      tags,
      tourism:
        tags.tourism ||
        tags.historic ||
        tags.amenity ||
        tags.shop ||
        tags.natural ||
        "unknown",
      category: determineCategory(tags),
      hasName: !!tags.name,
    };
  }
}
