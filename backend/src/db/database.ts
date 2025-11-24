import { DatabaseAdapter } from "./adapter";
import dotenv from "dotenv";

dotenv.config();

let db: DatabaseAdapter;

if (process.env.DATABASE_URL) {
  console.log("Using Postgres database");
  // Dynamic import for PostgresAdapter
  const { PostgresAdapter } = require("./postgresAdapter");
  db = new PostgresAdapter(process.env.DATABASE_URL);
} else {
  console.log("Using SQLite database");
  // Dynamic import for SqliteAdapter to avoid loading better-sqlite3 in production
  const { SqliteAdapter } = require("./sqliteAdapter");
  db = new SqliteAdapter();
}

export default db;
