import type { DB } from "../../db";
import type { NewIncident } from "../../db/schema";
import { incidentsRepository } from "./incidents.repository";

export type SearchIncidentsParams = {
  status?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
};

const searchIncidents = async (db: DB, params: SearchIncidentsParams) => {
  const rows = await incidentsRepository.findByStatus(db, params.status);

  if (params.lat && params.lng && params.radius_km) {
    const filtered = rows.filter((incident) => {
      const dist = haversineKm(
        params.lat!,
        params.lng!,
        incident.lat,
        incident.lng,
      );
      return dist <= params.radius_km!;
    });
    return { incidents: filtered, total: filtered.length };
  }

  return { incidents: rows, total: rows.length };
};

const getIncidentById = async (db: DB, id: string) => {
  const incident = await incidentsRepository.findById(db, id);
  if (!incident) throw new Error("Incident not found");
  return incident;
};

const createIncident = async (db: DB, payload: NewIncident) => {
  return incidentsRepository.createIncident(db, payload);
};

const updateIncident = async (
  db: DB,
  id: string,
  body: Record<string, unknown>,
) => {
  const allowed = [
    "title",
    "description",
    "type",
    "status",
    "lat",
    "lng",
    "radius_km",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const drizzleKey = key === "radius_km" ? "radiusKm" : key;
      updates[drizzleKey] = body[key];
    }
  }

  const updated = await incidentsRepository.updateById(db, id, updates);
  if (!updated) throw new Error("Incident not found");
  return updated;
};

const archiveIncident = async (db: DB, id: string) => {
  const updated = await incidentsRepository.updateById(db, id, {
    status: "archived",
  });
  if (!updated) throw new Error("Incident not found");
  return updated;
};

// haversine

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export const incidentsService = {
  searchIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  archiveIncident,
};
