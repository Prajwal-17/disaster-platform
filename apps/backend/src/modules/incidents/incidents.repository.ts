import { eq } from "drizzle-orm";
import type { DB } from "../../db";
import { incidents } from "../../db/schema";
import type { NewIncident } from "../../db/schema";

const findById = async (db: DB, id: string) => {
  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, id))
    .limit(1);
  return incident;
};

const findByStatus = async (db: DB, status: string = "active") => {
  return db
    .select()
    .from(incidents)
    .where(eq(incidents.status, status as any));
};

const createIncident = async (db: DB, payload: NewIncident) => {
  const [incident] = await db
    .insert(incidents)
    .values(payload)
    .returning();
  return incident;
};

const updateById = async (
  db: DB,
  id: string,
  updates: Record<string, unknown>
) => {
  const [updated] = await db
    .update(incidents)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(incidents.id, id))
    .returning();
  return updated;
};

export const incidentsRepository = {
  findById,
  findByStatus,
  createIncident,
  updateById,
};
