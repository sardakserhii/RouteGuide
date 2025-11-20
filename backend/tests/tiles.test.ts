import {
  getTilesForRoute,
  TILE_SIZE_DEG,
  latToIndex,
  lonToIndex,
} from "../src/utils/tiles";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testGetTilesForRoute() {
  console.log("Testing getTilesForRoute...");

  // Case 1: Single point, small radius
  const route1 = [[52.52, 13.405]]; // Berlin
  const radius1 = 5; // 5km
  const tiles1 = getTilesForRoute(route1, radius1);

  console.log(`Case 1: ${tiles1.length} tiles found.`);
  assert(tiles1.length > 0, "Should return at least one tile");

  // Verify the point is inside one of the tiles
  const latIdx = latToIndex(52.52);
  const lonIdx = lonToIndex(13.405);
  const expectedId = `${latIdx}_${lonIdx}`;
  const found = tiles1.some((t) => t.id === expectedId);
  assert(
    found,
    `Should contain the tile covering the point (expected ${expectedId})`
  );

  // Case 2: Long route crossing tiles
  // Route from Berlin to Potsdam (approx 30km)
  const route2 = [
    [52.52, 13.405],
    [52.45, 13.2],
    [52.39, 13.06],
  ];
  const radius2 = 10;
  const tiles2 = getTilesForRoute(route2, radius2);

  console.log(`Case 2: ${tiles2.length} tiles found.`);
  assert(tiles2.length > 1, "Should return multiple tiles for a longer route");

  // Check uniqueness
  const ids = tiles2.map((t) => t.id);
  const uniqueIds = new Set(ids);
  assert(ids.length === uniqueIds.size, "Should return unique tiles");

  console.log("All tests passed!");
}

try {
  testGetTilesForRoute();
} catch (e) {
  console.error(e);
  process.exit(1);
}
