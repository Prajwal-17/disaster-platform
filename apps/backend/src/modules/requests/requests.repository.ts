import { eq, and } from "drizzle-orm";
import type { DB } from "../../db";
import { resourceRequests, volunteerResponses } from "../../db/schema";
import type { NewResourceRequest } from "../../db/schema";

const findById = async (db: DB, id: string) => {
  const [request] = await db
    .select()
    .from(resourceRequests)
    .where(eq(resourceRequests.id, id))
    .limit(1);
  return request;
};

const findByIncidentId = async (
  db: DB,
  incidentId: string,
  filters: { status?: string; type?: string; urgency?: string }
) => {
  const conditions = [eq(resourceRequests.incidentId, incidentId)];
  if (filters.status) conditions.push(eq(resourceRequests.status, filters.status as any));
  if (filters.type) conditions.push(eq(resourceRequests.type, filters.type as any));
  if (filters.urgency) conditions.push(eq(resourceRequests.urgency, filters.urgency as any));

  return db
    .select()
    .from(resourceRequests)
    .where(and(...conditions));
};

const getActiveVolunteerCount = async (db: DB, requestId: string) => {
  const activeResponses = await db
    .select()
    .from(volunteerResponses)
    .where(
      and(
        eq(volunteerResponses.requestId, requestId),
        eq(volunteerResponses.status, "en_route")
      )
    );
  return activeResponses.length;
};

const createRequest = async (db: DB, payload: NewResourceRequest) => {
  const [request] = await db
    .insert(resourceRequests)
    .values(payload)
    .returning();
  return request;
};

const updateById = async (
  db: DB,
  id: string,
  updates: Record<string, unknown>
) => {
  const [updated] = await db
    .update(resourceRequests)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(resourceRequests.id, id))
    .returning();
  return updated;
};

export const requestsRepository = {
  findById,
  findByIncidentId,
  getActiveVolunteerCount,
  createRequest,
  updateById,
};
