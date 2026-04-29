import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

// Drop the placeholder table from the initial scaffold — it was never used
await sql`DROP TABLE IF EXISTS "users" CASCADE`;

console.log("✓ Dropped old 'users' table");
