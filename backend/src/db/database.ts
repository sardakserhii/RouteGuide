import { DatabaseAdapter } from "./adapter";
import dotenv from "dotenv";

dotenv.config();

let db: DatabaseAdapter;

try {
  if (process.env.DATABASE_URL) {
    console.log("[Database] Using Postgres database (Supabase)");
    // Mask the password in logs
    const connectionString = process.env.DATABASE_URL;
    const masked = connectionString.replace(/:([^:@]+)@/, ":****@");
    console.log("[Database] Connection string:", masked);
    // Dynamic import for PostgresAdapter
    const { PostgresAdapter } = require("./postgresAdapter");
    db = new PostgresAdapter(connectionString);
  } else {
    console.log(
      "[Database] ⚠️  DATABASE_URL not found, falling back to SQLite"
    );
    console.log(
      "[Database] ⚠️  Warning: POI data will be stored locally and not synced to cloud"
    );
    // Dynamic import for SqliteAdapter to avoid loading better-sqlite3 in production
    const { SqliteAdapter } = require("./sqliteAdapter");
    db = new SqliteAdapter();
  }
} catch (error: any) {
  console.error("[Database] Failed to initialize database adapter:", error);
  throw error;
}

export default db;
