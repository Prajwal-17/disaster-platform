import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!);

async function dropAll() {
  await sql`DROP SCHEMA public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  await sql`GRANT ALL ON SCHEMA public TO postgres;`;
  await sql`GRANT ALL ON SCHEMA public TO public;`;
  console.log("✓ Dropped all tables and types");
  await sql.end();
  process.exit(0);
}

dropAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
