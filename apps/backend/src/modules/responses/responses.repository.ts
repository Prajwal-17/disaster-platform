import { eq, and } from "drizzle-orm";
import type { DB } from "../../db";
import { volunteerResponses, user } from "../../db/schema";
import type { NewVolunteerResponse } from "../../db/schema";

const findByRequestAndVolunteer = async (
  db: DB,
  requestId: string,
  volunteerId: string
) => {
  const [response] = await db
    .select()
    .from(volunteerResponses)
    .where(
      and(
        eq(volunteerResponses.requestId, requestId),
        eq(volunteerResponses.volunteerId, volunteerId)
      )
    )
    .limit(1);
  return response;
};

const getActiveResponsesCount = async (db: DB, requestId: string) => {
  const activeVolunteers = await db
    .select()
    .from(volunteerResponses)
    .where(
      and(
        eq(volunteerResponses.requestId, requestId),
        eq(volunteerResponses.status, "en_route")
      )
    );
  return activeVolunteers.length;
};

const createResponse = async (db: DB, payload: NewVolunteerResponse) => {
  const [response] = await db
    .insert(volunteerResponses)
    .values(payload)
    .returning();
  return response;
};

const updateResponseStatus = async (
  db: DB,
  id: string,
  status: "en_route" | "arrived" | "cancelled"
) => {
  const [updated] = await db
    .update(volunteerResponses)
    .set({ status, updatedAt: new Date() })
    .where(eq(volunteerResponses.id, id))
    .returning();
  return updated;
};

const getVolunteersByRequest = async (db: DB, requestId: string) => {
  return db
    .select({
      responseId: volunteerResponses.id,
      status: volunteerResponses.status,
      createdAt: volunteerResponses.createdAt,
      volunteer: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
    .from(volunteerResponses)
    .innerJoin(user, eq(volunteerResponses.volunteerId, user.id))
    .where(eq(volunteerResponses.requestId, requestId));
};

export const responsesRepository = {
  findByRequestAndVolunteer,
  getActiveResponsesCount,
  createResponse,
  updateResponseStatus,
  getVolunteersByRequest,
};
