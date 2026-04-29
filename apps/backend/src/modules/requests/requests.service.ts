import type { DB } from "../../db";
import { requestsRepository } from "./requests.repository";
import { incidentsRepository } from "../incidents/incidents.repository";
import type { NewResourceRequest } from "../../db/schema";

export type SearchRequestsParams = {
  status?: string;
  type?: string;
  urgency?: string;
};

const getRequestsByIncident = async (
  db: DB,
  incidentId: string,
  params: SearchRequestsParams
) => {
  const incident = await incidentsRepository.findById(db, incidentId);
  if (!incident) throw new Error("Incident not found");

  const requests = await requestsRepository.findByIncidentId(db, incidentId, params);

  const requestsWithCounts = await Promise.all(
    requests.map(async (req) => {
      const activeCount = await requestsRepository.getActiveVolunteerCount(db, req.id);
      return {
        ...req,
        volunteerCount: activeCount,
        isFull: activeCount >= req.maxVolunteers,
      };
    })
  );

  return { requests: requestsWithCounts, total: requestsWithCounts.length };
};

const getRequestById = async (db: DB, id: string) => {
  const request = await requestsRepository.findById(db, id);
  if (!request) throw new Error("Request not found");

  const activeCount = await requestsRepository.getActiveVolunteerCount(db, id);

  return {
    ...request,
    volunteerCount: activeCount,
    isFull: activeCount >= request.maxVolunteers,
  };
};

const createRequest = async (
  db: DB,
  incidentId: string,
  requesterId: string,
  body: Record<string, any>
) => {
  const incident = await incidentsRepository.findById(db, incidentId);
  if (!incident) throw new Error("Incident not found");
  if (incident.status !== "active") {
    throw new Error("Cannot add requests to an inactive incident");
  }

  const payload: NewResourceRequest = {
    incidentId,
    requesterId,
    title: body.title,
    description: body.description,
    type: body.type,
    lat: parseFloat(body.lat),
    lng: parseFloat(body.lng),
    urgency: body.urgency ?? "medium",
    maxVolunteers: body.max_volunteers ?? 10,
    metadata: body.metadata ?? null,
  };

  return requestsRepository.createRequest(db, payload);
};

const updateRequest = async (
  db: DB,
  id: string,
  userId: string,
  userRole: string,
  body: Record<string, unknown>
) => {
  const existing = await requestsRepository.findById(db, id);
  if (!existing) throw new Error("Request not found");

  if (existing.requesterId !== userId && userRole !== "admin") {
    throw new Error("Forbidden");
  }

  const allowed = ["title", "description", "status", "urgency", "metadata", "max_volunteers"];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      const drizzleKey = key === "max_volunteers" ? "maxVolunteers" : key;
      updates[drizzleKey] = body[key];
    }
  }

  const updated = await requestsRepository.updateById(db, id, updates);
  if (!updated) throw new Error("Request not found");
  return updated;
};

const cancelRequest = async (db: DB, id: string, userId: string, userRole: string) => {
  const existing = await requestsRepository.findById(db, id);
  if (!existing) throw new Error("Request not found");

  if (existing.requesterId !== userId && userRole !== "admin") {
    throw new Error("Forbidden");
  }

  const updated = await requestsRepository.updateById(db, id, { status: "cancelled" });
  if (!updated) throw new Error("Request not found");
  return updated;
};

export const requestsService = {
  getRequestsByIncident,
  getRequestById,
  createRequest,
  updateRequest,
  cancelRequest,
};
