import path from "path";
import fs from "fs";
import { DatabaseAdapter } from "./adapter.js";
import { Poi } from "../services/overpassService.js";
import { Tile } from "../utils/tiles.js";
import { DbPoi, DbTile } from "./types.js";
import { determineCategory } from "../config/categories.js";

export class SqliteAdapter implements DatabaseAdapter {
  private db: any;

  constructor() {
    const DB_DIR = path.join(process.cwd(), "data");
    const DB_PATH = path.join(DB_DIR, "poi_cache.db");

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Dynamic require to avoid bundling better-sqlite3 when not used (e.g. in Vercel/Postgres)
    const Database = require("better-sqlite3");
    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pois (
        id TEXT PRIMARY KEY,
        osm_type TEXT NOT NULL,
        osm_id INTEGER NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        tags TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tiles (
        id TEXT NOT NULL,
        min_lat REAL NOT NULL,
        max_lat REAL NOT NULL,
        min_lon REAL NOT NULL,
        max_lon REAL NOT NULL,
        filters_hash TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        PRIMARY KEY (id, filters_hash)
      );

      CREATE TABLE IF NOT EXISTS tile_pois (
        tile_id TEXT NOT NULL,
        filters_hash TEXT NOT NULL,
        poi_id TEXT NOT NULL,
        PRIMARY KEY (tile_id, filters_hash, poi_id),
        FOREIGN KEY (tile_id, filters_hash) REFERENCES tiles(id, filters_hash) ON DELETE CASCADE,
        FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_pois_coords ON pois(lat, lon);
      CREATE INDEX IF NOT EXISTS idx_tiles_filters ON tiles(filters_hash);
      CREATE INDEX IF NOT EXISTS idx_tile_pois_tile ON tile_pois(tile_id, filters_hash);
      CREATE INDEX IF NOT EXISTS idx_tile_pois_poi ON tile_pois(poi_id);
    `);
  }

  async upsertPoi(poi: Poi): Promise<void> {
    const stmt = this.db.prepare(`
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

  async getPoiById(id: string): Promise<Poi | null> {
    const stmt = this.db.prepare("SELECT * FROM pois WHERE id = ?");
    const row = stmt.get(id) as DbPoi | undefined;
    return row ? this.dbPoiToPoi(row) : null;
  }

  async getPoisByIds(ids: string[]): Promise<Poi[]> {
    if (ids.length === 0) return [];
    const BATCH_SIZE = 900;
    const allRows: DbPoi[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const placeholders = batchIds.map(() => "?").join(",");
      const stmt = this.db.prepare(
        `SELECT * FROM pois WHERE id IN (${placeholders})`
      );
      const rows = stmt.all(...batchIds) as DbPoi[];
      allRows.push(...rows);
    }

    return allRows.map((r) => this.dbPoiToPoi(r));
  }

  async getTileById(id: string, filtersHash: string): Promise<DbTile | null> {
    const stmt = this.db.prepare(
      "SELECT * FROM tiles WHERE id = ? AND filters_hash = ?"
    );
    const row = stmt.get(id, filtersHash) as DbTile | undefined;
    return row || null;
  }

  async upsertTile(tile: Tile, filtersHash: string): Promise<void> {
    const stmt = this.db.prepare(`
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

  async isTileFresh(
    tileId: string,
    filtersHash: string,
    ttlDays: number
  ): Promise<boolean> {
    const tile = await this.getTileById(tileId, filtersHash);
    if (!tile) return false;

    const fetchedAt = new Date(tile.fetched_at);
    const now = new Date();
    const diffMs = now.getTime() - fetchedAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays < ttlDays;
  }

  async linkPoiToTile(
    tileId: string,
    poiId: string,
    filtersHash: string
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO tile_pois (tile_id, filters_hash, poi_id)
      VALUES (?, ?, ?)
    `);
    stmt.run(tileId, filtersHash, poiId);
  }

  async getPoisForTile(tileId: string, filtersHash: string): Promise<string[]> {
    const stmt = this.db.prepare(
      "SELECT poi_id FROM tile_pois WHERE tile_id = ? AND filters_hash = ?"
    );
    const rows = stmt.all(tileId, filtersHash) as { poi_id: string }[];
    return rows.map((r) => r.poi_id);
  }

  async clearTilePois(tileId: string, filtersHash: string): Promise<void> {
    const stmt = this.db.prepare(
      "DELETE FROM tile_pois WHERE tile_id = ? AND filters_hash = ?"
    );
    stmt.run(tileId, filtersHash);
  }

  async getTilesByIds(ids: string[], filtersHash: string): Promise<DbTile[]> {
    if (ids.length === 0) return [];
    const BATCH_SIZE = 900;
    const allRows: DbTile[] = [];

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      const placeholders = batchIds.map(() => "?").join(",");
      const stmt = this.db.prepare(
        `SELECT * FROM tiles WHERE id IN (${placeholders}) AND filters_hash = ?`
      );
      const rows = stmt.all(...batchIds, filtersHash) as DbTile[];
      allRows.push(...rows);
    }
    return allRows;
  }

  async getAllPoisForTiles(
    tileIds: string[],
    filtersHash: string
  ): Promise<{ tile_id: string; poi_id: string }[]> {
    if (tileIds.length === 0) return [];
    const BATCH_SIZE = 900;
    const allRows: { tile_id: string; poi_id: string }[] = [];

    for (let i = 0; i < tileIds.length; i += BATCH_SIZE) {
      const batchIds = tileIds.slice(i, i + BATCH_SIZE);
      const placeholders = batchIds.map(() => "?").join(",");
      const stmt = this.db.prepare(
        `SELECT tile_id, poi_id FROM tile_pois WHERE tile_id IN (${placeholders}) AND filters_hash = ?`
      );
      const rows = stmt.all(...batchIds, filtersHash) as {
        tile_id: string;
        poi_id: string;
      }[];
      allRows.push(...rows);
    }
    return allRows;
  }

  private dbPoiToPoi(row: DbPoi): Poi {
    const tags = typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags;
    return {
      id: row.osm_id,
      type: row.osm_type as "node" | "way" | "relation",
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
