import { DatabaseAdapter } from "./adapter";
import dotenv from "dotenv";

dotenv.config();

let db: DatabaseAdapter;

if (process.env.DATABASE_URL) {
  console.log("[Database] Using Postgres database (Supabase)");
  const connectionPreview = process.env.DATABASE_URL.substring(0, 30) + "...";
  console.log("[Database] Connection string starts with:", connectionPreview);
  // Dynamic import for PostgresAdapter
  const { PostgresAdapter } = require("./postgresAdapter");
  db = new PostgresAdapter(process.env.DATABASE_URL);
} else {
  console.log("[Database] ⚠️  DATABASE_URL not found, falling back to SQLite");
  console.log(
    "[Database] ⚠️  Warning: POI data will be stored locally and not synced to cloud"
  );
  // Dynamic import for SqliteAdapter to avoid loading better-sqlite3 in production
  const { SqliteAdapter } = require("./sqliteAdapter");
  db = new SqliteAdapter();
}

export default db;
