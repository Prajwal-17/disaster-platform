import { Hono } from "hono";
import { getDb } from "../../db";
import { authMiddleware, requireRole } from "../../middleware/auth";
import type { HonoEnv } from "../../types";
import { incidentsService } from "./incidents.service";

export const incidentsController = new Hono<HonoEnv>();

incidentsController.get("/", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { lat, lng, radius_km, status } = c.req.query();

  const params = {
    status,
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
    radius_km: radius_km ? parseFloat(radius_km) : undefined,
  };

  const result = await incidentsService.searchIncidents(db, params);
  return c.json(result);
});

incidentsController.get("/:id", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { id } = c.req.param();

  try {
    const incident = await incidentsService.getIncidentById(db, id);
    return c.json({ incident });
  } catch (error: any) {
    return c.json({ error: error.message }, 404);
  }
});

incidentsController.post(
  "/",
  authMiddleware,
  requireRole("ngo", "admin"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const user = c.get("user");
    const body = await c.req.json();

    const { title, description, type, lat, lng, radius_km } = body;

    if (!title || !description || !type || lat == null || lng == null) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const payload = {
      title,
      description,
      type,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radiusKm: radius_km ? parseFloat(radius_km) : 10,
      createdBy: user.id,
    };

    const incident = await incidentsService.createIncident(db, payload as any);
    return c.json({ incident }, 201);
  },
);

incidentsController.patch(
  "/:id",
  authMiddleware,
  requireRole("ngo", "admin"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { id } = c.req.param();
    const body = await c.req.json();

    try {
      const updated = await incidentsService.updateIncident(db, id, body);
      return c.json({ incident: updated });
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  },
);

incidentsController.delete(
  "/:id",
  authMiddleware,
  requireRole("admin"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { id } = c.req.param();

    try {
      const updated = await incidentsService.archiveIncident(db, id);
      return c.json({ message: "Incident archived", incident: updated });
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  },
);
