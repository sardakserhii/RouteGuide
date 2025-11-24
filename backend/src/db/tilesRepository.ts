import db from "./database";
import { Tile } from "../utils/tiles";
import { DbTile } from "./types";

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
    await db.linkPoiToTile(tileId, filtersHash, poiId);
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
}
