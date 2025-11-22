import { Poi } from "../services/overpassService";

/**
 * Interleaves POIs from different categories to ensure diversity.
 * Groups POIs by category, sorts each group by the provided sort function (or preserves order),
 * and then picks one from each category in a round-robin fashion.
 */
export function interleaveCategories(
  pois: Poi[],
  sortFn?: (a: Poi, b: Poi) => number
): Poi[] {
  if (!pois.length) return [];

  // 1. Group by category
  const groups: Record<string, Poi[]> = {};
  for (const poi of pois) {
    const cat = poi.category || "unknown";
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(poi);
  }

  // 2. Sort each group if sortFn provided
  const categories = Object.keys(groups);
  if (sortFn) {
    for (const cat of categories) {
      groups[cat].sort(sortFn);
    }
  }

  // 3. Interleave
  const result: Poi[] = [];
  let maxLength = 0;
  for (const cat of categories) {
    maxLength = Math.max(maxLength, groups[cat].length);
  }

  for (let i = 0; i < maxLength; i++) {
    for (const cat of categories) {
      if (groups[cat][i]) {
        result.push(groups[cat][i]);
      }
    }
  }

  return result;
}
