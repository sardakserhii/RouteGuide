import db from "./database";
import { Tile } from "../utils/tiles";

export interface DbTile {
  id: string;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  filters_hash: string;
  fetched_at: string;
}

export class TilesRepository {
  getTileById(id: string, filtersHash: string): DbTile | null {
    const stmt = db.prepare(
      "SELECT * FROM tiles WHERE id = ? AND filters_hash = ?"
    );
    const row = stmt.get(id, filtersHash) as DbTile | undefined;
    return row || null;
  }

  upsertTile(tile: Tile, filtersHash: string): void {
    const stmt = db.prepare(`
      INSERT INTO tiles (id, min_lat, max_lat, min_lon, max_lon, filters_hash, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id, filters_hash) DO UPDATE SET
        fetched_at = excluded.fetched_at
    `);

    const now = new Date().toISOString();
    stmt.run(
      tile.id,
      tile.minLat,
      tile.maxLat,
      tile.minLon,
      tile.maxLon,
      filtersHash,
      now
    );
  }

  isTileFresh(tileId: string, filtersHash: string, ttlDays: number): boolean {
    const tile = this.getTileById(tileId, filtersHash);
    if (!tile) return false;

    const fetchedAt = new Date(tile.fetched_at);
    const now = new Date();
    const diffMs = now.getTime() - fetchedAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays < ttlDays;
  }

  linkPoiToTile(tileId: string, poiId: string, filtersHash: string): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO tile_pois (tile_id, filters_hash, poi_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(tileId, filtersHash, poiId);
  }

  getPoisForTile(tileId: string, filtersHash: string): string[] {
    const stmt = db.prepare(
      "SELECT poi_id FROM tile_pois WHERE tile_id = ? AND filters_hash = ?"
    );
    const rows = stmt.all(tileId, filtersHash) as { poi_id: string }[];
    return rows.map((r) => r.poi_id);
  }

  clearTilePois(tileId: string, filtersHash: string): void {
    const stmt = db.prepare(
      "DELETE FROM tile_pois WHERE tile_id = ? AND filters_hash = ?"
    );
    stmt.run(tileId, filtersHash);
  }
}
