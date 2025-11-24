import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

interface DbPoi {
    id: string;
    osm_type: string;
    osm_id: number;
    lat: number;
    lon: number;
    tags: string;
    updated_at: string;
}

interface DbTile {
    id: string;
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
    filters_hash: string;
    fetched_at: string;
}

interface DbTilePoi {
    tile_id: string;
    filters_hash: string;
    poi_id: string;
}

async function migrateSqliteToPostgres() {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set in .env file");
        console.log(
            "\nPlease add your Supabase connection string to backend/.env:"
        );
        console.log(
            "DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
        );
        process.exit(1);
    }

    console.log("🚀 Starting migration from SQLite to PostgreSQL...\n");

    // Connect to SQLite
    const DB_PATH = path.join(process.cwd(), "data", "poi_cache.db");
    console.log(`📂 SQLite database: ${DB_PATH}`);

    const sqlite = new Database(DB_PATH);

    // Connect to PostgreSQL
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    try {
        // Test PostgreSQL connection
        await pool.query("SELECT NOW()");
        console.log("✅ Connected to PostgreSQL\n");

        // Get counts from SQLite
        const poisCount = sqlite
            .prepare("SELECT COUNT(*) as count FROM pois")
            .get() as { count: number };
        const tilesCount = sqlite
            .prepare("SELECT COUNT(*) as count FROM tiles")
            .get() as { count: number };
        const tilePoisCount = sqlite
            .prepare("SELECT COUNT(*) as count FROM tile_pois")
            .get() as { count: number };

        console.log("📊 SQLite database stats:");
        console.log(`   POIs: ${poisCount.count}`);
        console.log(`   Tiles: ${tilesCount.count}`);
        console.log(`   Tile-POI links: ${tilePoisCount.count}\n`);

        if (poisCount.count === 0) {
            console.log("⚠️  No data to migrate. SQLite database is empty.");
            await pool.end();
            sqlite.close();
            return;
        }

        // Migrate POIs
        console.log("📦 Migrating POIs...");
        const pois = sqlite.prepare("SELECT * FROM pois").all() as DbPoi[];
        let poisMigrated = 0;

        for (const poi of pois) {
            await pool.query(
                `INSERT INTO pois (id, osm_type, osm_id, lat, lon, tags, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           lat = EXCLUDED.lat,
           lon = EXCLUDED.lon,
           tags = EXCLUDED.tags,
           updated_at = EXCLUDED.updated_at`,
                [
                    poi.id,
                    poi.osm_type,
                    poi.osm_id,
                    poi.lat,
                    poi.lon,
                    poi.tags,
                    poi.updated_at,
                ]
            );
            poisMigrated++;
            if (poisMigrated % 100 === 0) {
                process.stdout.write(
                    `   Migrated ${poisMigrated}/${pois.length} POIs...\r`
                );
            }
        }
        console.log(`   ✅ Migrated ${poisMigrated} POIs\n`);

        // Migrate Tiles
        console.log("🗺️  Migrating Tiles...");
        const tiles = sqlite.prepare("SELECT * FROM tiles").all() as DbTile[];
        let tilesMigrated = 0;

        for (const tile of tiles) {
            await pool.query(
                `INSERT INTO tiles (id, min_lat, max_lat, min_lon, max_lon, filters_hash, fetched_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id, filters_hash) DO UPDATE SET
           fetched_at = EXCLUDED.fetched_at`,
                [
                    tile.id,
                    tile.min_lat,
                    tile.max_lat,
                    tile.min_lon,
                    tile.max_lon,
                    tile.filters_hash,
                    tile.fetched_at,
                ]
            );
            tilesMigrated++;
            if (tilesMigrated % 50 === 0) {
                process.stdout.write(
                    `   Migrated ${tilesMigrated}/${tiles.length} Tiles...\r`
                );
            }
        }
        console.log(`   ✅ Migrated ${tilesMigrated} Tiles\n`);

        // Migrate Tile-POI links
        console.log("🔗 Migrating Tile-POI links...");
        const tilePois = sqlite
            .prepare("SELECT * FROM tile_pois")
            .all() as DbTilePoi[];
        let linksMigrated = 0;

        for (const link of tilePois) {
            await pool.query(
                `INSERT INTO tile_pois (tile_id, filters_hash, poi_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
                [link.tile_id, link.filters_hash, link.poi_id]
            );
            linksMigrated++;
            if (linksMigrated % 100 === 0) {
                process.stdout.write(
                    `   Migrated ${linksMigrated}/${tilePois.length} links...\r`
                );
            }
        }
        console.log(`   ✅ Migrated ${linksMigrated} Tile-POI links\n`);

        // Verify migration
        console.log("🔍 Verifying migration...");
        const pgPoisCount = await pool.query(
            "SELECT COUNT(*) as count FROM pois"
        );
        const pgTilesCount = await pool.query(
            "SELECT COUNT(*) as count FROM tiles"
        );
        const pgTilePoisCount = await pool.query(
            "SELECT COUNT(*) as count FROM tile_pois"
        );

        console.log("📊 PostgreSQL database stats:");
        console.log(`   POIs: ${pgPoisCount.rows[0].count}`);
        console.log(`   Tiles: ${pgTilesCount.rows[0].count}`);
        console.log(`   Tile-POI links: ${pgTilePoisCount.rows[0].count}\n`);

        if (
            pgPoisCount.rows[0].count === poisCount.count.toString() &&
            pgTilesCount.rows[0].count === tilesCount.count.toString() &&
            pgTilePoisCount.rows[0].count === tilePoisCount.count.toString()
        ) {
            console.log("✅ Migration completed successfully!\n");
            console.log("💡 Next steps:");
            console.log(
                "   1. Keep DATABASE_URL in backend/.env to use PostgreSQL"
            );
            console.log("   2. Restart your backend server");
            console.log(
                "   3. New POIs will now be saved to Supabase PostgreSQL"
            );
        } else {
            console.log(
                "⚠️  Warning: Record counts don't match. Please verify manually."
            );
        }
    } catch (error: any) {
        console.error("\n❌ Migration failed:", error.message);
        throw error;
    } finally {
        await pool.end();
        sqlite.close();
    }
}

// Run migration
migrateSqliteToPostgres()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
