import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  // Drop the placeholder table from the initial scaffold — it was never used
  await sql`DROP TABLE IF EXISTS "users" CASCADE`;

  console.log("✓ Dropped old 'users' table");
  await sql.end();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
