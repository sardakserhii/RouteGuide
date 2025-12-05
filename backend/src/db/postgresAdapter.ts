import { Pool } from "pg";
import { DatabaseAdapter } from "./adapter.js";
import { Poi } from "../services/overpassService.js";
import { Tile } from "../utils/tiles.js";
import { DbPoi, DbTile } from "./types.js";
import { determineCategory } from "../config/categories.js";

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Supabase
    });
  }

  async upsertPoi(poi: Poi): Promise<void> {
    const query = `
      INSERT INTO pois (id, osm_type, osm_id, lat, lon, tags, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(id) DO UPDATE SET
        lat = EXCLUDED.lat,
        lon = EXCLUDED.lon,
        tags = EXCLUDED.tags,
        updated_at = EXCLUDED.updated_at
    `;

    const id = `${poi.type}/${poi.id}`;
    const tags = poi.tags; // pg handles object to JSONB automatically
    const now = new Date().toISOString();

    try {
      await this.pool.query(query, [
        id,
        poi.type,
        poi.id,
        poi.lat,
        poi.lon,
        tags,
        now,
      ]);
    } catch (error: any) {
      console.error(
        `[PostgresAdapter] Error upserting POI ${id}:`,
        error.message
      );
      throw error;
    }
  }

  async getPoiById(id: string): Promise<Poi | null> {
    const query = "SELECT * FROM pois WHERE id = $1";
    const res = await this.pool.query(query, [id]);
    const row = res.rows[0] as DbPoi | undefined;
    return row ? this.dbPoiToPoi(row) : null;
  }

  async getPoisByIds(ids: string[]): Promise<Poi[]> {
    if (ids.length === 0) return [];
    // Postgres supports ANY($1) for arrays, which is cleaner than IN (?,?,?)
    const query = "SELECT * FROM pois WHERE id = ANY($1)";
    const res = await this.pool.query(query, [ids]);
    return res.rows.map((r) => this.dbPoiToPoi(r));
  }

  async getTileById(id: string, filtersHash: string): Promise<DbTile | null> {
    const query = "SELECT * FROM tiles WHERE id = $1 AND filters_hash = $2";
    const res = await this.pool.query(query, [id, filtersHash]);
    return (res.rows[0] as DbTile) || null;
  }

  async upsertTile(tile: Tile, filtersHash: string): Promise<void> {
    const query = `
      INSERT INTO tiles (id, min_lat, max_lat, min_lon, max_lon, filters_hash, fetched_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT(id, filters_hash) DO UPDATE SET
        fetched_at = EXCLUDED.fetched_at
    `;

    const now = new Date().toISOString();
    try {
      await this.pool.query(query, [
        tile.id,
        tile.minLat,
        tile.maxLat,
        tile.minLon,
        tile.maxLon,
        filtersHash,
        now,
      ]);
    } catch (error: any) {
      console.error(
        `[PostgresAdapter] Error upserting tile ${tile.id}:`,
        error.message
      );
      throw error;
    }
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
    const query = `
      INSERT INTO tile_pois (tile_id, filters_hash, poi_id)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `;
    try {
      await this.pool.query(query, [tileId, filtersHash, poiId]);
    } catch (error: any) {
      console.error(
        `[PostgresAdapter] Error linking POI ${poiId} to tile ${tileId}:`,
        error.message
      );
      throw error;
    }
  }

  async getPoisForTile(tileId: string, filtersHash: string): Promise<string[]> {
    const query =
      "SELECT poi_id FROM tile_pois WHERE tile_id = $1 AND filters_hash = $2";
    const res = await this.pool.query(query, [tileId, filtersHash]);
    return res.rows.map((r: { poi_id: string }) => r.poi_id);
  }

  async clearTilePois(tileId: string, filtersHash: string): Promise<void> {
    const query =
      "DELETE FROM tile_pois WHERE tile_id = $1 AND filters_hash = $2";
    await this.pool.query(query, [tileId, filtersHash]);
  }

  async getTilesByIds(ids: string[], filtersHash: string): Promise<DbTile[]> {
    if (ids.length === 0) return [];
    const query =
      "SELECT * FROM tiles WHERE id = ANY($1) AND filters_hash = $2";
    const res = await this.pool.query(query, [ids, filtersHash]);
    return res.rows as DbTile[];
  }

  async getAllPoisForTiles(
    tileIds: string[],
    filtersHash: string
  ): Promise<{ tile_id: string; poi_id: string }[]> {
    if (tileIds.length === 0) return [];
    const query =
      "SELECT tile_id, poi_id FROM tile_pois WHERE tile_id = ANY($1) AND filters_hash = $2";
    const res = await this.pool.query(query, [tileIds, filtersHash]);
    return res.rows as { tile_id: string; poi_id: string }[];
  }

  /**
   * Saves tile and links POIs in a single transaction.
   * This ensures atomicity - if any operation fails, all are rolled back.
   */
  async saveTileWithPois(
    tile: Tile,
    filtersHash: string,
    poiIds: string[]
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Upsert tile
      const upsertTileQuery = `
        INSERT INTO tiles (id, min_lat, max_lat, min_lon, max_lon, filters_hash, fetched_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(id, filters_hash) DO UPDATE SET
          fetched_at = EXCLUDED.fetched_at
      `;
      const now = new Date().toISOString();
      await client.query(upsertTileQuery, [
        tile.id,
        tile.minLat,
        tile.maxLat,
        tile.minLon,
        tile.maxLon,
        filtersHash,
        now,
      ]);

      // 2. Clear old POI links for this tile
      const clearQuery =
        "DELETE FROM tile_pois WHERE tile_id = $1 AND filters_hash = $2";
      await client.query(clearQuery, [tile.id, filtersHash]);

      // 3. Link all POIs to tile in batch
      if (poiIds.length > 0) {
        // Build batch insert query for efficiency
        const values: string[] = [];
        const params: (string | number)[] = [];
        let paramIndex = 1;

        for (const poiId of poiIds) {
          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
          params.push(tile.id, filtersHash, poiId);
          paramIndex += 3;
        }

        const linkQuery = `
          INSERT INTO tile_pois (tile_id, filters_hash, poi_id)
          VALUES ${values.join(", ")}
          ON CONFLICT DO NOTHING
        `;
        await client.query(linkQuery, params);
      }

      await client.query("COMMIT");
      console.log(
        `[PostgresAdapter] Transaction committed: tile ${tile.id} with ${poiIds.length} POIs`
      );
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error(
        `[PostgresAdapter] Transaction rolled back for tile ${tile.id}:`,
        error.message
      );
      throw error;
    } finally {
      client.release();
    }
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
