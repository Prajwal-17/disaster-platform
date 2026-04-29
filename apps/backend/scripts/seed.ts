import { faker } from "@faker-js/faker";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createAuth } from "../src/lib/authMiddleware";
import {
  user,
  incidents,
  resourceRequests,
  volunteerResponses,
  userLocations,
} from "../src/db/schema";

const seed = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set");

  const queryClient = postgres(dbUrl);
  const db = drizzle(queryClient);

  console.log("🌱 Starting database seeding...");

  // Clear existing data (optional, but good for fresh seeds)
  console.log("🧹 Clearing old data...");
  await db.delete(userLocations);
  await db.delete(volunteerResponses);
  await db.delete(resourceRequests);
  await db.delete(incidents);
  await db.delete(user);

  // 1. Create Static Users with Passwords via Better Auth
  const auth = createAuth({
    DATABASE_URL: dbUrl,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "fallback-secret",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:8787",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    DISASTER_COORDINATION: {} as any,
  });

  const staticUsersToCreate = [
    {
      name: "Test Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
    },
    {
      name: "Test NGO",
      email: "ngo@test.com",
      password: "password123",
      role: "ngo",
    },
    {
      name: "Test Volunteer",
      email: "volunteer@test.com",
      password: "password123",
      role: "volunteer",
    },
  ];

  const insertedUsers = [];

  for (const u of staticUsersToCreate) {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
        },
      });
      console.log(`✅ Created test user: ${u.email} (pwd: ${u.password})`);
      if (res?.user) insertedUsers.push(res.user);
    } catch (err: any) {
      console.log(`⚠️ Failed to create ${u.email}:`, err.message);
    }
  }

  // Use Faker to create additional dummy users (without passwords for now, just to fill out the tables)
  const roles: Array<"volunteer" | "donor" | "ngo" | "admin"> = [
    "volunteer",
    "volunteer",
    "volunteer",
    "donor",
    "ngo",
    "admin",
  ];
  const fakeUsers = Array.from({ length: 12 }).map(() => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    emailVerified: true,
    role: faker.helpers.arrayElement(roles),
    image: faker.image.avatar(),
  }));

  console.log(`👤 Inserting ${fakeUsers.length} fake users...`);
  const fakeInserted = await db.insert(user).values(fakeUsers).returning();
  insertedUsers.push(...fakeInserted);

  // 2. Create Incidents
  const incidentTypes: Array<
    "flood" | "earthquake" | "cyclone" | "fire" | "other"
  > = ["flood", "earthquake", "cyclone", "fire", "other"];
  const incidentStatuses: Array<"active" | "resolved" | "archived"> = [
    "active",
    "active",
    "active",
    "resolved",
  ];

  const adminOrNgoUsers = insertedUsers.filter(
    (u) => u.role === "ngo" || u.role === "admin",
  );

  if (adminOrNgoUsers.length === 0) {
    console.log("⚠️ No NGO/Admin users generated, skipping incidents seed.");
    return;
  }

  const incidentsData = Array.from({ length: 5 }).map(() => {
    // Generate lat/lng roughly around India
    const lat = faker.location.latitude({ min: 8, max: 37 });
    const lng = faker.location.longitude({ min: 68, max: 97 });

    return {
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(incidentTypes),
      status: faker.helpers.arrayElement(incidentStatuses),
      lat,
      lng,
      radiusKm: faker.number.int({ min: 5, max: 50 }),
      createdBy: faker.helpers.arrayElement(adminOrNgoUsers).id,
    };
  });

  console.log(`🚨 Inserting ${incidentsData.length} incidents...`);
  const insertedIncidents = await db
    .insert(incidents)
    .values(incidentsData)
    .returning();

  // 3. Create Resource Requests
  const requestTypes: Array<
    "blood" | "medicine" | "rescue" | "food" | "shelter" | "other"
  > = ["blood", "medicine", "rescue", "food", "shelter", "other"];
  const urgencyLevels: Array<"critical" | "high" | "medium" | "low"> = [
    "critical",
    "high",
    "medium",
    "low",
  ];

  const requestsData = Array.from({ length: 20 }).map(() => {
    const incident = faker.helpers.arrayElement(insertedIncidents);
    // Add slight offset to incident location for request
    const lat = incident.lat + faker.number.float({ min: -0.05, max: 0.05 });
    const lng = incident.lng + faker.number.float({ min: -0.05, max: 0.05 });

    return {
      id: faker.string.uuid(),
      incidentId: incident.id,
      requesterId: faker.helpers.arrayElement(insertedUsers).id,
      type: faker.helpers.arrayElement(requestTypes),
      title: faker.lorem.words(4),
      description: faker.lorem.sentence(),
      lat,
      lng,
      urgency: faker.helpers.arrayElement(urgencyLevels),
      status: faker.helpers.arrayElement([
        "open",
        "open",
        "in_progress",
        "fulfilled",
      ]),
      maxVolunteers: faker.number.int({ min: 1, max: 20 }),
      metadata: { priority: faker.number.int({ min: 1, max: 5 }) },
    };
  });

  console.log(`📦 Inserting ${requestsData.length} resource requests...`);
  const insertedRequests = await db
    .insert(resourceRequests)
    .values(requestsData)
    .returning();

  // 4. Create Volunteer Responses
  const responseStatuses: Array<"en_route" | "arrived" | "cancelled"> = [
    "en_route",
    "arrived",
  ];
  const volunteerUsers = insertedUsers.filter(
    (u) => u.role === "volunteer" || u.role === "donor",
  );

  if (volunteerUsers.length > 0) {
    // Make sure we don't duplicate (requestId, volunteerId) pairs
    const usedPairs = new Set<string>();
    const responsesData: any[] = [];

    for (let i = 0; i < 30; i++) {
      const request = faker.helpers.arrayElement(insertedRequests);
      const volunteer = faker.helpers.arrayElement(volunteerUsers);
      const pairKey = `${request.id}-${volunteer.id}`;

      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        responsesData.push({
          id: faker.string.uuid(),
          requestId: request.id,
          volunteerId: volunteer.id,
          status: faker.helpers.arrayElement(responseStatuses),
        });
      }
    }

    console.log(`🏃 Inserting ${responsesData.length} volunteer responses...`);
    if (responsesData.length > 0) {
      await db.insert(volunteerResponses).values(responsesData);
    }
  }

  // 5. Create User Locations
  const locationsData = insertedUsers.map((u) => {
    // Generate locations globally or near a specific incident
    const lat = faker.location.latitude({ min: 8, max: 37 });
    const lng = faker.location.longitude({ min: 68, max: 97 });

    return {
      id: faker.string.uuid(),
      userId: u.id,
      lat,
      lng,
      // Randomize updated_at within the last hour
      updatedAt: faker.date.recent({ days: 1 / 24 }),
    };
  });

  console.log(`📍 Inserting ${locationsData.length} user locations...`);
  await db.insert(userLocations).values(locationsData);

  console.log("✅ Seeding complete!");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
