import crypto from "crypto";
import { Tile } from "../utils/tiles";
import { Poi, OverpassService } from "./overpassService";
import { PoisRepository } from "../db/poisRepository";
import { TilesRepository } from "../db/tilesRepository";

export interface PoiFilters {
  categories: string[];
  maxDistance?: number | null;
}

export class TilePoisService {
  private overpassService: OverpassService;
  private poisRepo: PoisRepository;
  private tilesRepo: TilesRepository;

  constructor() {
    this.overpassService = new OverpassService();
    this.poisRepo = new PoisRepository();
    this.tilesRepo = new TilesRepository();
  }

  /**
   * Generates a stable hash for filters to use in cache keys
   */
  private calculateFiltersHash(filters: PoiFilters): string {
    const normalized = {
      categories: [...filters.categories].sort(),
      maxDistance: filters.maxDistance,
    };
    const str = JSON.stringify(normalized);
    return crypto.createHash("md5").update(str).digest("hex").substring(0, 8);
  }

  /**
   * Loads POIs for a single tile, using cache if available and fresh
   */
  async loadTilePois(
    tile: Tile,
    filters: PoiFilters,
    options: { ttlDays: number; requestDelay?: number }
  ): Promise<Poi[]> {
    const filtersHash = this.calculateFiltersHash(filters);
    const tileKey = `${tile.id}_${filtersHash}`;

    // Check if tile is cached and fresh
    if (this.tilesRepo.isTileFresh(tile.id, filtersHash, options.ttlDays)) {
      console.log(`[TilePoisService] Cache hit for tile ${tileKey}`);
      const poiIds = this.tilesRepo.getPoisForTile(tile.id, filtersHash);
      const pois = this.poisRepo.getPoisByIds(poiIds);
      return pois;
    }

    // Add delay before making request to avoid rate limiting
    const requestDelay = options.requestDelay || 0;
    if (requestDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, requestDelay));
    }

    // Cache miss or stale - fetch from Overpass
    console.log(
      `[TilePoisService] Cache miss for tile ${tileKey}, fetching from Overpass...`
    );

    try {
      const bbox = [tile.minLat, tile.maxLat, tile.minLon, tile.maxLon];
      const pois = await this.overpassService.fetchPois(
        bbox,
        undefined, // No route filtering here, we use bbox
        filters.categories,
        null, // No max deviation for tile fetch
        1000 // High limit per tile
      );

      // Update tile record
      this.tilesRepo.upsertTile(tile, filtersHash);

      // Clear old POI links for this tile
      this.tilesRepo.clearTilePois(tile.id, filtersHash);

      // Store POIs and link to tile
      for (const poi of pois) {
        this.poisRepo.upsertPoi(poi);
        const poiId = `${poi.type}/${poi.id}`;
        this.tilesRepo.linkPoiToTile(tile.id, poiId, filtersHash);
      }

      console.log(
        `[TilePoisService] Cached ${pois.length} POIs for tile ${tileKey}`
      );
      return pois;
    } catch (error: any) {
      console.error(
        `[TilePoisService] Error fetching tile ${tileKey}:`,
        error.message
      );

      // Try to return stale cache if available
      const poiIds = this.tilesRepo.getPoisForTile(tile.id, filtersHash);
      if (poiIds.length > 0) {
        console.log(
          `[TilePoisService] Returning stale cache for tile ${tileKey}`
        );
        return this.poisRepo.getPoisByIds(poiIds);
      }

      throw error;
    }
  }
}
