import { DatabaseAdapter } from "./adapter";
import dotenv from "dotenv";

dotenv.config();

let db: DatabaseAdapter;

try {
  if (process.env.DATABASE_URL) {
    console.log("[Database] Using Postgres database (Supabase)");
    // Mask the password in logs
    const connectionString = process.env.DATABASE_URL;
export default db;
