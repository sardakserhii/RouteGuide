import db from "./database.js";
import { Tile } from "../utils/tiles.js";
import { DbTile } from "./types.js";

export class TilesRepository {
  async getTileById(id: string, filtersHash: string): Promise<DbTile | null> {
    return await db.getTileById(id, filtersHash);
  }

  async upsertTile(tile: Tile, filtersHash: string): Promise<void> {
    await db.upsertTile(tile, filtersHash);
  }

  async isTileFresh(
    tileId: string,
    filtersHash: string,
    ttlDays: number
  ): Promise<boolean> {
    return await db.isTileFresh(tileId, filtersHash, ttlDays);
  }

  async linkPoiToTile(
    tileId: string,
    poiId: string,
    filtersHash: string
  ): Promise<void> {
    await db.linkPoiToTile(tileId, poiId, filtersHash);
  }

  async getPoisForTile(tileId: string, filtersHash: string): Promise<string[]> {
    return await db.getPoisForTile(tileId, filtersHash);
  }

  async clearTilePois(tileId: string, filtersHash: string): Promise<void> {
    await db.clearTilePois(tileId, filtersHash);
  }

  async getTilesByIds(ids: string[], filtersHash: string): Promise<DbTile[]> {
    return await db.getTilesByIds(ids, filtersHash);
  }

  async getAllPoisForTiles(
    tileIds: string[],
    filtersHash: string
  ): Promise<{ tile_id: string; poi_id: string }[]> {
    return await db.getAllPoisForTiles(tileIds, filtersHash);
  }

  /**
   * Saves tile and links POIs atomically using a transaction if supported.
   * Falls back to sequential operations if transaction not available.
   */
  async saveTileWithPois(
    tile: Tile,
    filtersHash: string,
    poiIds: string[]
  ): Promise<void> {
    if (db.saveTileWithPois) {
      // Use transaction-based method (PostgreSQL)
      await db.saveTileWithPois(tile, filtersHash, poiIds);
    } else {
      // Fallback for SQLite or adapters without transaction support
      await db.upsertTile(tile, filtersHash);
      await db.clearTilePois(tile.id, filtersHash);
      for (const poiId of poiIds) {
        await db.linkPoiToTile(tile.id, poiId, filtersHash);
      }
    }
  }
}
