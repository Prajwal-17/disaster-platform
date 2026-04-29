import { Hono } from "hono";
import { getDb } from "../../db";
import { authMiddleware, requireRole } from "../../middleware/auth";
import type { HonoEnv } from "../../types";
import { requestsService } from "./requests.service";

export const requestsController = new Hono<HonoEnv>();

requestsController.get("/incidents/:id/requests", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { id: incidentId } = c.req.param();
  const { status, type, urgency } = c.req.query();

  try {
    const result = await requestsService.getRequestsByIncident(db, incidentId, {
      status,
      type,
      urgency,
    });
    return c.json(result);
  } catch (error: any) {
    return c.json(
      { error: error.message },
      error.message === "Incident not found" ? 404 : 400,
    );
  }
});

requestsController.post(
  "/incidents/:id/requests",
  authMiddleware,
  requireRole("volunteer", "ngo", "admin"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { id: incidentId } = c.req.param();
    const user = c.get("user");
    const body = await c.req.json();

    if (
      !body.title ||
      !body.description ||
      !body.type ||
      body.lat == null ||
      body.lng == null
    ) {
      return c.json(
        {
          error: "Missing required fields: title, description, type, lat, lng",
        },
        400,
      );
    }

    try {
      const request = await requestsService.createRequest(
        db,
        incidentId,
        user.id,
        body,
      );
      return c.json({ request }, 201);
    } catch (error: any) {
      return c.json(
        { error: error.message },
        error.message === "Incident not found" ? 404 : 400,
      );
    }
  },
);

// ─── GET /api/requests/:id ────────────────────────────────────────────────────
requestsController.get("/requests/:id", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { id } = c.req.param();

  try {
    const request = await requestsService.getRequestById(db, id);
    return c.json({ request });
  } catch (error: any) {
    return c.json({ error: error.message }, 404);
  }
});

// ─── PATCH /api/requests/:id ──────────────────────────────────────────────────
requestsController.patch("/requests/:id", authMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { id } = c.req.param();
  const user = c.get("user");
  const body = await c.req.json();

  try {
    const request = await requestsService.updateRequest(
      db,
      id,
      user.id,
      user.role,
      body,
    );
    return c.json({ request });
  } catch (error: any) {
    const status = error.message === "Forbidden" ? 403 : 404;
    return c.json({ error: error.message }, status);
  }
});

// ─── DELETE /api/requests/:id ─────────────────────────────────────────────────
requestsController.delete("/requests/:id", authMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { id } = c.req.param();
  const user = c.get("user");

  try {
    const request = await requestsService.cancelRequest(
      db,
      id,
      user.id,
      user.role,
    );
    return c.json({ message: "Request cancelled", request });
  } catch (error: any) {
    const status = error.message === "Forbidden" ? 403 : 404;
    return c.json({ error: error.message }, status);
  }
});
