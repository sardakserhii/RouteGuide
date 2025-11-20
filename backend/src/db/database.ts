import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "poi_cache.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");

// Check if tiles table needs migration (from old single-key to composite key)
const needsMigration = (() => {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(tiles)").all() as Array<{
      name: string;
      pk: number;
    }>;
    // If table exists and has only one primary key column (id), it needs migration
    const pkColumns = tableInfo.filter((col) => col.pk > 0);
    return (
      tableInfo.length > 0 &&
      pkColumns.length === 1 &&
      pkColumns[0].name === "id"
    );
  } catch {
    return false;
  }
})();

if (needsMigration) {
  console.log(
    "Migrating tiles table to use composite primary key (id, filters_hash)..."
  );
  db.exec(`
    -- Drop the old tiles table and related data
    DROP TABLE IF EXISTS tile_pois;
    DROP TABLE IF EXISTS tiles;
  `);
  console.log("Old tiles table dropped, creating new schema...");
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS pois (
    id TEXT PRIMARY KEY,
    osm_type TEXT NOT NULL,
    osm_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    tags TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tiles (
    id TEXT NOT NULL,
    min_lat REAL NOT NULL,
    max_lat REAL NOT NULL,
    min_lon REAL NOT NULL,
    max_lon REAL NOT NULL,
    filters_hash TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    PRIMARY KEY (id, filters_hash)
  );

  CREATE TABLE IF NOT EXISTS tile_pois (
    tile_id TEXT NOT NULL,
    filters_hash TEXT NOT NULL,
    poi_id TEXT NOT NULL,
    PRIMARY KEY (tile_id, filters_hash, poi_id),
    FOREIGN KEY (tile_id, filters_hash) REFERENCES tiles(id, filters_hash) ON DELETE CASCADE,
    FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_pois_coords ON pois(lat, lon);
  CREATE INDEX IF NOT EXISTS idx_tiles_filters ON tiles(filters_hash);
  CREATE INDEX IF NOT EXISTS idx_tile_pois_tile ON tile_pois(tile_id, filters_hash);
  CREATE INDEX IF NOT EXISTS idx_tile_pois_poi ON tile_pois(poi_id);
`);

console.log(`SQLite database initialized at ${DB_PATH}`);

export default db;
