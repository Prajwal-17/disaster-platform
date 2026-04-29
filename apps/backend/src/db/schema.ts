import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  incidentStatusEnum,
  incidentTypeEnum,
  requestStatusEnum,
  resourceTypeEnum,
  responseStatusEnum,
  urgencyLevelEnum,
  userRoleEnum,
} from "./enums";

export * from "./enums";

// auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("volunteer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// core tables
export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: incidentTypeEnum("type").notNull(),
  status: incidentStatusEnum("status").notNull().default("active"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  radiusKm: real("radius_km").notNull().default(10),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const resourceRequests = pgTable("resource_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id")
    .notNull()
    .references(() => incidents.id, { onDelete: "cascade" }),
  requesterId: text("requester_id")
    .notNull()
    .references(() => user.id),
  type: resourceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  urgency: urgencyLevelEnum("urgency").notNull().default("medium"),
  status: requestStatusEnum("status").notNull().default("open"),
  maxVolunteers: integer("max_volunteers").notNull().default(10),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const volunteerResponses = pgTable(
  "volunteer_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => resourceRequests.id, { onDelete: "cascade" }),
    volunteerId: text("volunteer_id")
      .notNull()
      .references(() => user.id),
    status: responseStatusEnum("status").notNull().default("en_route"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_volunteer_request").on(
      table.requestId,
      table.volunteerId,
    ),
  ],
);

export const userLocations = pgTable("user_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// types
export type User = typeof user.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type ResourceRequest = typeof resourceRequests.$inferSelect;
export type VolunteerResponse = typeof volunteerResponses.$inferSelect;
export type UserLocation = typeof userLocations.$inferSelect;

export type NewIncident = typeof incidents.$inferInsert;
export type NewResourceRequest = typeof resourceRequests.$inferInsert;
export type NewVolunteerResponse = typeof volunteerResponses.$inferInsert;
