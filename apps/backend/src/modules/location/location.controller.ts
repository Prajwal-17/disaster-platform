import { Hono } from "hono";
import { getDb } from "../../db";
import { authMiddleware } from "../../middleware/auth";
import type { HonoEnv } from "../../types";
import { locationService } from "./location.service";

export const locationController = new Hono<HonoEnv>();

locationController.put("/", authMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const currentUser = c.get("user");
  const { lat, lng } = await c.req.json();

  if (lat == null || lng == null) {
    return c.json({ error: "lat and lng are required" }, 400);
  }

  const location = await locationService.upsertLocation(
    db,
    currentUser.id,
    parseFloat(lat),
    parseFloat(lng)
  );

  return c.json({ location });
});

locationController.get("/nearby", authMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { lat, lng, radius_km } = c.req.query();

  if (!lat || !lng) {
    return c.json({ error: "lat and lng query params are required" }, 400);
  }

  const radius = radius_km ? parseFloat(radius_km) : 10;
  const result = await locationService.getNearbyActiveLocations(
    db,
    parseFloat(lat),
    parseFloat(lng),
    radius
  );

  return c.json(result);
});
