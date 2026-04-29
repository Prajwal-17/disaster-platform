import type { DB } from "../../db";
import { responsesRepository } from "./responses.repository";
import { requestsRepository } from "../requests/requests.repository";

const respondToRequest = async (db: DB, requestId: string, volunteerId: string) => {
  const request = await requestsRepository.findById(db, requestId);
  if (!request) throw new Error("Request not found");

  if (request.status === "cancelled" || request.status === "fulfilled") {
    throw new Error("This request is no longer active");
  }

  const existing = await responsesRepository.findByRequestAndVolunteer(db, requestId, volunteerId);

  if (existing && existing.status === "en_route") {
    throw new Error("You are already responding to this request");
  }

  const volunteerCount = await responsesRepository.getActiveResponsesCount(db, requestId);

  const warning =
    volunteerCount >= request.maxVolunteers
      ? {
          type: "VOLUNTEER_WARNING",
          message: `${volunteerCount} volunteers are already heading here. Your help may not be needed, but you can still proceed.`,
          count: volunteerCount,
          max: request.maxVolunteers,
        }
      : null;

  let response;
  if (existing) {
    response = await responsesRepository.updateResponseStatus(db, existing.id, "en_route");
  } else {
    response = await responsesRepository.createResponse(db, {
      requestId,
      volunteerId,
      status: "en_route",
    });
  }

  // Auto-transition request to in_progress when first volunteer responds
  if (request.status === "open" && volunteerCount === 0) {
    await requestsRepository.updateById(db, requestId, { status: "in_progress" });
  }

  return { response, warning };
};

const updateResponseStatus = async (
  db: DB,
  requestId: string,
  volunteerId: string,
  status: string
) => {
  if (!status || !["arrived", "cancelled"].includes(status)) {
    throw new Error("status must be 'arrived' or 'cancelled'");
  }

  const existing = await responsesRepository.findByRequestAndVolunteer(db, requestId, volunteerId);
  if (!existing) throw new Error("No active response found");

  return responsesRepository.updateResponseStatus(db, existing.id, status as any);
};

const withdrawResponse = async (db: DB, requestId: string, volunteerId: string) => {
  const existing = await responsesRepository.findByRequestAndVolunteer(db, requestId, volunteerId);
  if (!existing) throw new Error("No response found to withdraw");

  await responsesRepository.updateResponseStatus(db, existing.id, "cancelled");
};

const getVolunteers = async (db: DB, requestId: string) => {
  const volunteers = await responsesRepository.getVolunteersByRequest(db, requestId);
  return { volunteers, total: volunteers.length };
};

export const responsesService = {
  respondToRequest,
  updateResponseStatus,
  withdrawResponse,
  getVolunteers,
};
