import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function dropAll() {
  await sql`DROP SCHEMA public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  await sql`GRANT ALL ON SCHEMA public TO neondb_owner;`;
  await sql`GRANT ALL ON SCHEMA public TO public;`;
  console.log("✓ Dropped all tables and types");
}

dropAll().catch(console.error);
