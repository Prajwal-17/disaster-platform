import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

/**
 * Factory function — creates a Drizzle DB client using node-postgres (pg).
 * Accepts a DATABASE_URL connection string pointing to a local or remote
 * PostgreSQL instance (e.g. Docker).
 */
export function getDb(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
}

export type DB = ReturnType<typeof getDb>;
