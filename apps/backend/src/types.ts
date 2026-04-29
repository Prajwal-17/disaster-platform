import type { createAuth } from "./lib/authMiddleware";

export type UserRole = "volunteer" | "donor" | "ngo" | "admin";

export type IncidentType =
  | "flood"
  | "earthquake"
  | "cyclone"
  | "fire"
  | "other";
export type IncidentStatus = "active" | "resolved" | "archived";

export type ResourceType =
  | "blood"
  | "medicine"
  | "rescue"
  | "food"
  | "shelter"
  | "other";
export type UrgencyLevel = "critical" | "high" | "medium" | "low";
export type RequestStatus = "open" | "in_progress" | "fulfilled" | "cancelled";

export type ResponseStatus = "en_route" | "arrived" | "cancelled";

// worker bindings
export interface CloudflareBindings {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  FRONTEND_URL: string;
  // Durable Object namespace
  DISASTER_COORDINATION: DurableObjectNamespace;
}

type Auth = ReturnType<typeof createAuth>;

export interface HonoVariables {
  user: Auth["$Infer"]["Session"]["user"] & { role: UserRole };
  session: Auth["$Infer"]["Session"]["session"];
}

export type HonoEnv = {
  Bindings: CloudflareBindings;
  Variables: HonoVariables;
};

export const WS_EVENT = {
  // Client → Server
  SUBSCRIBE: "SUBSCRIBE",
  VOLUNTEER_UPDATE: "VOLUNTEER_UPDATE",
  REQUEST_CREATE: "REQUEST_CREATE",
  REQUEST_UPDATE: "REQUEST_UPDATE",
  LOCATION_PING: "LOCATION_PING",

  // Server → Client
  SUBSCRIBED: "SUBSCRIBED",
  REQUEST_CREATED: "REQUEST_CREATED",
  REQUEST_UPDATED: "REQUEST_UPDATED",
  VOLUNTEER_WARNING: "VOLUNTEER_WARNING",
  PEER_LOCATION: "PEER_LOCATION",
  ERROR: "ERROR",
} as const;

export type WSEvent = (typeof WS_EVENT)[keyof typeof WS_EVENT];

export type WSConnectionState = {
  userId: string;
  role: UserRole;
  incidentId: string;
};
