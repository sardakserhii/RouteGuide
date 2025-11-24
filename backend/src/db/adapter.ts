import { Poi } from "../services/overpassService.js";
import { Tile } from "../utils/tiles.js";
import { DbPoi, DbTile } from "./types.js";

export interface DatabaseAdapter {
  // POI operations
  upsertPoi(poi: Poi): Promise<void>;
  getPoiById(id: string): Promise<Poi | null>;
  getPoisByIds(ids: string[]): Promise<Poi[]>;

  // Tile operations
  getTileById(id: string, filtersHash: string): Promise<DbTile | null>;
  upsertTile(tile: Tile, filtersHash: string): Promise<void>;
  isTileFresh(
    tileId: string,
    filtersHash: string,
    ttlDays: number
  ): Promise<boolean>;
  linkPoiToTile(
    tileId: string,
    poiId: string,
    filtersHash: string
  ): Promise<void>;
  getPoisForTile(tileId: string, filtersHash: string): Promise<string[]>;
  clearTilePois(tileId: string, filtersHash: string): Promise<void>;
  getTilesByIds(ids: string[], filtersHash: string): Promise<DbTile[]>;
  getAllPoisForTiles(
    tileIds: string[],
    filtersHash: string
  ): Promise<{ tile_id: string; poi_id: string }[]>;
}
