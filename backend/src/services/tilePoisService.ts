import { Tile } from "../utils/tiles";
import { Poi, OverpassService } from "./overpassService";
import { PoisRepository } from "../db/poisRepository";
import { TilesRepository } from "../db/tilesRepository";
import { buildFiltersHash } from "../utils/filtersHash";
import { CATEGORY_MAPPINGS } from "../config/categories";

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
   * Loads POIs for a single tile, using cache if available and fresh
   */
  async loadTilePois(
    tile: Tile,
    filters: PoiFilters,
    options: { ttlDays: number; requestDelay?: number }
  ): Promise<Poi[]> {
    // 1. Try to load from "all categories" cache (superset)
    const allCategories = Object.keys(CATEGORY_MAPPINGS);
    const allCategoriesHash = buildFiltersHash(allCategories);

    if (
      await this.tilesRepo.isTileFresh(
        tile.id,
        allCategoriesHash,
        options.ttlDays
      )
    ) {
      console.log(`[TilePoisService] Superset cache hit for tile ${tile.id}`);
      const poiIds = await this.tilesRepo.getPoisForTile(
        tile.id,
        allCategoriesHash
      );
      const allPois = await this.poisRepo.getPoisByIds(poiIds);

      // Filter in memory
      const filteredPois = allPois.filter((poi) =>
        filters.categories.includes(poi.category)
      );

      return filteredPois;
    }

    // 2. Fallback to specific cache
    const filtersHash = buildFiltersHash(filters.categories);
    const tileKey = `${tile.id}_${filtersHash}`;

    // Check if tile is cached and fresh
    if (
      await this.tilesRepo.isTileFresh(tile.id, filtersHash, options.ttlDays)
    ) {
      console.log(`[TilePoisService] Cache hit for tile ${tileKey}`);
      const poiIds = await this.tilesRepo.getPoisForTile(tile.id, filtersHash);
      const pois = await this.poisRepo.getPoisByIds(poiIds);
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
      await this.tilesRepo.upsertTile(tile, filtersHash);

      // Clear old POI links for this tile
      await this.tilesRepo.clearTilePois(tile.id, filtersHash);

      // Store POIs and link to tile
      for (const poi of pois) {
        await this.poisRepo.upsertPoi(poi);
        const poiId = `${poi.type}/${poi.id}`;
        await this.tilesRepo.linkPoiToTile(tile.id, poiId, filtersHash);
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
      const poiIds = await this.tilesRepo.getPoisForTile(tile.id, filtersHash);
      if (poiIds.length > 0) {
        console.log(
          `[TilePoisService] Returning stale cache for tile ${tileKey}`
        );
        return await this.poisRepo.getPoisByIds(poiIds);
      }

      throw error;
    }
  }

  /**
   * Bulk checks cache for multiple tiles.
   * Returns POIs for cached tiles and a list of tiles that need fetching.
   */
  async getCachedPoisForTiles(
    tiles: Tile[],
    filters: PoiFilters,
    options: { ttlDays: number }
  ): Promise<{ cachedPois: Poi[]; missingTiles: Tile[] }> {
    const allCategories = Object.keys(CATEGORY_MAPPINGS);
    const allCategoriesHash = buildFiltersHash(allCategories);
    const filtersHash = buildFiltersHash(filters.categories);

    const tileIds = tiles.map((t) => t.id);
    const cachedPois: Poi[] = [];
    const missingTiles: Tile[] = [];

    // 1. Check "all categories" cache (superset)
    const supersetTiles = await this.tilesRepo.getTilesByIds(
      tileIds,
      allCategoriesHash
    );
    const supersetTileIds = new Set<string>();

    // Filter fresh superset tiles
    const freshSupersetTiles = supersetTiles.filter((t) => {
      const fetchedAt = new Date(t.fetched_at);
      const diffDays =
        (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < options.ttlDays;
    });

    freshSupersetTiles.forEach((t) => supersetTileIds.add(t.id));

    // 2. Check specific cache for remaining tiles
    const remainingTileIds = tileIds.filter((id) => !supersetTileIds.has(id));
    let freshSpecificTiles: any[] = [];

    if (remainingTileIds.length > 0) {
      const specificTiles = await this.tilesRepo.getTilesByIds(
        remainingTileIds,
        filtersHash
      );
      freshSpecificTiles = specificTiles.filter((t) => {
        const fetchedAt = new Date(t.fetched_at);
        const diffDays =
          (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays < options.ttlDays;
      });
    }

    const specificTileIds = new Set(freshSpecificTiles.map((t: any) => t.id));

    // 3. Collect POI IDs
    // For superset tiles
    if (freshSupersetTiles.length > 0) {
      const links = await this.tilesRepo.getAllPoisForTiles(
        freshSupersetTiles.map((t) => t.id),
        allCategoriesHash
      );
      const poiIds = links.map((l) => l.poi_id);
      // Batch get POIs
      // Note: getPoisByIds handles empty array, but we check length anyway
      if (poiIds.length > 0) {
        // We might have duplicates if multiple tiles point to same POI, but getPoisByIds returns unique POIs by ID usually?
        // Actually getPoisByIds just does "WHERE id IN (...)" so it returns unique POIs if input IDs are unique.
        // But links might have duplicates? No, poi_id is unique per tile?
        // A POI can be in multiple tiles.
        // We should deduplicate IDs before querying POIs repo to be safe and efficient.
        const uniquePoiIds = Array.from(new Set(poiIds));
        const pois = await this.poisRepo.getPoisByIds(uniquePoiIds);

        // Filter in memory
        const filtered = pois.filter((p) =>
          filters.categories.includes(p.category)
        );
        cachedPois.push(...filtered);
      }
    }

    // For specific tiles
    if (freshSpecificTiles.length > 0) {
      const links = await this.tilesRepo.getAllPoisForTiles(
        freshSpecificTiles.map((t: any) => t.id),
        filtersHash
      );
      const poiIds = links.map((l) => l.poi_id);
      if (poiIds.length > 0) {
        const uniquePoiIds = Array.from(new Set(poiIds));
        const pois = await this.poisRepo.getPoisByIds(uniquePoiIds);
        cachedPois.push(...pois);
      }
    }

    // 4. Identify missing tiles
    for (const tile of tiles) {
      if (!supersetTileIds.has(tile.id) && !specificTileIds.has(tile.id)) {
        missingTiles.push(tile);
      }
    }

    return { cachedPois, missingTiles };
  }
}
