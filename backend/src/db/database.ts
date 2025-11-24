import { DatabaseAdapter } from "./adapter.js";
import { PostgresAdapter } from "./postgresAdapter.js";
import { SqliteAdapter } from "./sqliteAdapter.js";
import dotenv from "dotenv";

dotenv.config();

let db: DatabaseAdapter;

try {
  if (process.env.DATABASE_URL) {
    console.log("[Database] Using Postgres database (Supabase)");
    // Mask the password in logs
    const connectionString = process.env.DATABASE_URL;
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ":****@");
    console.log(`[Database] Connection: ${maskedUrl}`);

    db = new PostgresAdapter(connectionString);
    console.log("[Database] PostgresAdapter initialized successfully");
  } else {
    console.log("[Database] Using SQLite database (local development)");
    db = new SqliteAdapter();
    console.log("[Database] SqliteAdapter initialized successfully");
  }
} catch (error: any) {
  console.error("[Database] Initialization error:", error.message);
  // Fallback to SQLite if Postgres fails
  console.log("[Database] Falling back to SQLite");
  db = new SqliteAdapter();
}

export default db;
