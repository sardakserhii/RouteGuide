import { interleaveCategories } from "../src/utils/poiUtils";
import { Poi } from "../src/services/overpassService";

const createPoi = (id: number, category: string, distance: number): Poi => ({
  id,
  type: "node",
  lat: 0,
  lon: 0,
  tags: {},
  category,
  distance,
  tourism: category,
  name: "Test POI",
  hasName: true,
});

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testInterleaveCategories() {
  console.log("Running testInterleaveCategories...");
  const pois = [
    createPoi(1, "museum", 10),
    createPoi(2, "museum", 20),
    createPoi(3, "attraction", 15),
    createPoi(4, "attraction", 25),
  ];

  // Sort by distance ascending
  const sortFn = (a: Poi, b: Poi) => (a.distance || 0) - (b.distance || 0);

  const result = interleaveCategories(pois, sortFn);

  assert(result.length === 4, "Result length should be 4");

  const firstTwo = result.slice(0, 2);
  const categories = firstTwo.map((p) => p.category);

  assert(categories.includes("museum"), "First two should include museum");
  assert(
    categories.includes("attraction"),
    "First two should include attraction"
  );

  console.log("testInterleaveCategories passed!");
}

function testUnevenCounts() {
  console.log("Running testUnevenCounts...");
  const pois = [
    createPoi(1, "museum", 10),
    createPoi(2, "museum", 20),
    createPoi(3, "museum", 30),
    createPoi(4, "attraction", 15),
  ];

  const sortFn = (a: Poi, b: Poi) => (a.distance || 0) - (b.distance || 0);
  const result = interleaveCategories(pois, sortFn);

  assert(result.length === 4, "Result length should be 4");

  const firstTwo = result.slice(0, 2);
  assert(
    firstTwo.map((p) => p.category).includes("museum"),
    "First two should include museum"
  );
  assert(
    firstTwo.map((p) => p.category).includes("attraction"),
    "First two should include attraction"
  );

  assert(result[2].category === "museum", "3rd should be museum");
  assert(result[3].category === "museum", "4th should be museum");

  console.log("testUnevenCounts passed!");
}

try {
  testInterleaveCategories();
  testUnevenCounts();
  console.log("All tests passed!");
} catch (e) {
  console.error("Test failed:", e);
  throw e;
}
