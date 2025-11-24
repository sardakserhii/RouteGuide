import crypto from "crypto";

// Bump this when cache schema/logic changes so we can reuse the DB file
// but force fresh tile fetches (e.g., after adding centroid support).
const CACHE_SCHEMA_VERSION = "v2";

/**
 * Stable hash for tile caches based only on categories.
 * Keep independent of distance so preloaded data stays usable for any radius.
 */
export function buildFiltersHash(categories: string[]): string {
  const normalized = {
    version: CACHE_SCHEMA_VERSION,
    categories: [...categories].sort(),
  };
  const str = JSON.stringify(normalized);
  return crypto.createHash("md5").update(str).digest("hex").substring(0, 8);
}
