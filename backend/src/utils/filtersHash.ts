import crypto from "crypto";

/**
 * Stable hash for tile caches based only on categories.
 * Keep independent of distance so preloaded data stays usable for any radius.
 */
export function buildFiltersHash(categories: string[]): string {
  const normalized = { categories: [...categories].sort() };
  const str = JSON.stringify(normalized);
  return crypto.createHash("md5").update(str).digest("hex").substring(0, 8);
}
