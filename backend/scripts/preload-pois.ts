import { OverpassService } from "../src/services/overpassService";
import { PoisRepository } from "../src/db/poisRepository";
import { TilesRepository } from "../src/db/tilesRepository";
import { buildFiltersHash } from "../src/utils/filtersHash";
import { CATEGORY_MAPPINGS } from "../src/config/categories";

/**
 * Script to preload POI data for a specific region (e.g., Germany)
 * This populates the cache database before users request routes
 */

// Germany bounding box (approximate)
const REGIONS = {
  germany: {
    name: "Germany",
    bbox: {
      minLat: 47.27, // Southern border (Alps)
      maxLat: 55.06, // Northern border (North Sea)
      minLon: 5.87, // Western border (Netherlands)
      maxLon: 15.04, // Eastern border (Poland)
    },
  },
};

// Configuration
const TILE_SIZE = parseFloat(process.env.TILE_SIZE_DEG || "0.25");
const BATCH_SIZE = 3; // Process 3 tiles in parallel (matching endpoints)
const BATCH_DELAY_MS = 1000; // Delay between batches
const CATEGORIES = Object.keys(CATEGORY_MAPPINGS);

interface Tile {
  id: string;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * Generate all tiles for a bounding box
 */
function generateTiles(bbox: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}): Tile[] {
  const tiles: Tile[] = [];

  for (let lat = bbox.minLat; lat < bbox.maxLat; lat += TILE_SIZE) {
    for (let lon = bbox.minLon; lon < bbox.maxLon; lon += TILE_SIZE) {
      const minLat = lat;
      const maxLat = Math.min(lat + TILE_SIZE, bbox.maxLat);
      const minLon = lon;
      const maxLon = Math.min(lon + TILE_SIZE, bbox.maxLon);

      // Generate tile ID (same format as in tiles.ts)
      const latIndex = Math.floor(minLat / TILE_SIZE);
      const lonIndex = Math.floor(minLon / TILE_SIZE);
      const id = `${latIndex}_${lonIndex}`;

      tiles.push({ id, minLat, maxLat, minLon, maxLon });
    }
  }

  return tiles;
}

/**
 * Check if tile is already cached
 */
async function isTileCached(
  tilesRepo: TilesRepository,
  tileId: string,
  filtersHash: string
): Promise<boolean> {
  const tile = await tilesRepo.getTileById(tileId, filtersHash);
  return tile !== null;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main preload function
 */
async function preloadRegion(regionKey: keyof typeof REGIONS) {
  const region = REGIONS[regionKey];
  console.log(`\n🌍 Starting POI preload for ${region.name}`);
  console.log(`📍 Bounding box:`, region.bbox);

  // Initialize services
  const overpassService = new OverpassService();
  const poisRepo = new PoisRepository();
  const tilesRepo = new TilesRepository();

  // Generate tiles
  const tiles = generateTiles(region.bbox);
  console.log(`📦 Total tiles to process: ${tiles.length}`);
  console.log(
    `⏱️  Estimated time: ~${Math.ceil(
      (tiles.length / BATCH_SIZE) * (BATCH_DELAY_MS / 1000)
    )} seconds\n`
  );

  // Calculate filters hash
  const filtersHash = buildFiltersHash(CATEGORIES);

  // Filter out already cached tiles
  const uncachedTiles: Tile[] = [];
  for (const tile of tiles) {
    if (!(await isTileCached(tilesRepo, tile.id, filtersHash))) {
      uncachedTiles.push(tile);
    }
  }
  console.log(
    `✅ Already cached: ${tiles.length - uncachedTiles.length} tiles`
  );
  console.log(`⏳ To download: ${uncachedTiles.length} tiles\n`);

  if (uncachedTiles.length === 0) {
    console.log("🎉 All tiles already cached! Nothing to do.");
    return;
  }

  // Statistics
  let processed = 0;
  let successful = 0;
  let failed = 0;
  let totalPoisCached = 0;

  // Process tiles in batches
  for (let i = 0; i < uncachedTiles.length; i += BATCH_SIZE) {
    const batch = uncachedTiles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(uncachedTiles.length / BATCH_SIZE);

    console.log(
      `\n📥 Batch ${batchNum}/${totalBatches} (tiles ${i + 1}-${
        i + batch.length
      })`
    );

    // Add delay before each batch (except first)
    if (i > 0) {
      await sleep(BATCH_DELAY_MS);
    }

    // Process batch in parallel
    const batchPromises = batch.map(async (tile) => {
      try {
        const bbox = [tile.minLat, tile.maxLat, tile.minLon, tile.maxLon];
        const pois = await overpassService.fetchPois(
          bbox,
          undefined, // No route
          CATEGORIES,
          null, // No max deviation
          1000 // High limit
        );

        // Store in database
        await tilesRepo.upsertTile(tile, filtersHash);
        await tilesRepo.clearTilePois(tile.id, filtersHash);

        for (const poi of pois) {
          await poisRepo.upsertPoi(poi);
          const poiId = `${poi.type}/${poi.id}`;
          await tilesRepo.linkPoiToTile(tile.id, poiId, filtersHash);
        }

        console.log(`  ✓ ${tile.id}: ${pois.length} POIs cached`);

        return { success: true, tile, poisCount: pois.length };
      } catch (error: any) {
        console.log(`  ✗ ${tile.id}: Failed (${error.message})`);
        return { success: false, tile, poisCount: 0 };
      }
    });

    const results = await Promise.all(batchPromises);

    // Update statistics
    results.forEach((result) => {
      processed++;
      if (result.success) {
        successful++;
        totalPoisCached += result.poisCount;
      } else {
        failed++;
      }
    });

    // Show progress
    const progress = ((processed / uncachedTiles.length) * 100).toFixed(1);
    console.log(
      `\n📊 Progress: ${processed}/${uncachedTiles.length} tiles (${progress}%)`
    );
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📍 Total POIs cached: ${totalPoisCached}`);
  }

  // Final summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Preload complete!");
  console.log("=".repeat(50));
  console.log(`Region: ${region.name}`);
  console.log(`Total tiles: ${tiles.length}`);
  console.log(`Already cached: ${tiles.length - uncachedTiles.length}`);
  console.log(`Downloaded: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total POIs in database: ${totalPoisCached}`);
  console.log("=".repeat(50) + "\n");
}

// Main execution
const region = (process.argv[2] || "germany") as keyof typeof REGIONS;

if (!REGIONS[region]) {
  console.error(`❌ Unknown region: ${region}`);
  console.error(`Available regions: ${Object.keys(REGIONS).join(", ")}`);
  process.exit(1);
}

preloadRegion(region).catch((error) => {
  console.error("❌ Error during preload:", error);
  process.exit(1);
});
