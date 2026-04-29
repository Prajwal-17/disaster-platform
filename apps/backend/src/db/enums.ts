import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "volunteer",
  "donor",
  "ngo",
  "admin",
]);

export const incidentTypeEnum = pgEnum("incident_type", [
  "flood",
  "earthquake",
  "cyclone",
  "fire",
  "other",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "active",
  "resolved",
  "archived",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "blood",
  "medicine",
  "rescue",
  "food",
  "shelter",
  "other",
]);

export const urgencyLevelEnum = pgEnum("urgency_level", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "open",
  "in_progress",
  "fulfilled",
  "cancelled",
]);

export const responseStatusEnum = pgEnum("response_status", [
  "en_route",
  "arrived",
  "cancelled",
]);
