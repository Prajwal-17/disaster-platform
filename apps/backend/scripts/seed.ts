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
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "fallback-key",
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

  const insertedUsers: any[] = [];

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

  const realWorldIncidents = [
    {
      title: "Severe Flooding in Coastal Region",
      description: "Continuous heavy rainfall has caused the main river to overflow, inundating several villages in the region. Thousands are stranded and in need of immediate rescue and relief materials.",
      type: "flood" as const,
    },
    {
      title: "Magnitude 6.5 Earthquake",
      description: "A strong earthquake has struck the northern region, causing structural damage to numerous buildings. Power lines are down and several roads are blocked by debris.",
      type: "earthquake" as const,
    },
    {
      title: "Cyclone Landfall Warning",
      description: "A severe cyclonic storm has made landfall, bringing wind speeds of up to 150 km/h and heavy storm surges. Coastal communities have been evacuated but extensive damage to infrastructure is reported.",
      type: "cyclone" as const,
    },
    {
      title: "Massive Forest Fire",
      description: "Dry weather conditions have sparked a large-scale forest fire that is rapidly spreading towards residential areas. Firefighting teams are struggling to contain the blaze due to high winds.",
      type: "fire" as const,
    },
    {
      title: "Industrial Chemical Spill",
      description: "A train derailment has resulted in a massive chemical spill near a major water source. Hazardous materials teams are on-site and local residents are being advised to shelter in place.",
      type: "other" as const,
    }
  ];

  const incidentsData = Array.from({ length: 5 }).map((_, i) => {
    // Generate lat/lng roughly around India
    const lat = faker.location.latitude({ min: 8, max: 37 });
    const lng = faker.location.longitude({ min: 68, max: 97 });
    const scenario = realWorldIncidents[i % realWorldIncidents.length];

    return {
      id: faker.string.uuid(),
      title: scenario.title,
      description: scenario.description,
      type: scenario.type,
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

  const realWorldRequests = [
    { type: "blood", title: "Urgent O- Negative Blood Required", description: "Multiple trauma patients need O- negative blood immediately for surgery." },
    { type: "medicine", title: "Antibiotics and First Aid Kits", description: "Local clinic has run out of basic first aid supplies and antibiotics for treating water-borne diseases." },
    { type: "rescue", title: "Family Trapped on Roof", description: "A family of four is trapped on the roof of their flooded house. Water levels are still rising." },
    { type: "food", title: "Rations for Relief Camp", description: "Relief camp hosting 500 evacuated residents needs non-perishable food items and clean drinking water." },
    { type: "shelter", title: "Temporary Tents Needed", description: "Several families have lost their homes and are sleeping in the open. We need 50 temporary tents and blankets." },
    { type: "other", title: "Generators for Emergency Power", description: "The main hospital has lost power and backup generators are failing. Need portable generators to keep life-support running." },
    { type: "rescue", title: "Evacuation Truck Needed", description: "Elderly care facility needs high-clearance vehicles to evacuate 30 residents through flooded streets." },
    { type: "food", title: "Baby Formula and Diapers", description: "Multiple families with infants are requesting baby formula and diapers. Current supplies are completely depleted." }
  ];

  const requestsData = Array.from({ length: 20 }).map(() => {
    const incident = faker.helpers.arrayElement(insertedIncidents);
    // Add slight offset to incident location for request
    const lat = incident.lat + faker.number.float({ min: -0.05, max: 0.05 });
    const lng = incident.lng + faker.number.float({ min: -0.05, max: 0.05 });
    const scenario = faker.helpers.arrayElement(realWorldRequests);

    return {
      id: faker.string.uuid(),
      incidentId: incident.id,
      requesterId: faker.helpers.arrayElement(insertedUsers).id,
      type: scenario.type as "blood" | "medicine" | "rescue" | "food" | "shelter" | "other",
      title: scenario.title,
      description: scenario.description,
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
