import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Factory function — creates a Drizzle DB client per request using env bindings.
 * Never use a module-level singleton in CF Workers; the env is request-scoped.
 */
export function getDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type DB = ReturnType<typeof getDb>;
