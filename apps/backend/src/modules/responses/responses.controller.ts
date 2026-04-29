import { Hono } from "hono";
import { getDb } from "../../db";
import { authMiddleware, requireRole } from "../../middleware/auth";
import type { HonoEnv } from "../../types";
import { responsesService } from "./responses.service";

export const responsesController = new Hono<HonoEnv>();

responsesController.post(
  "/requests/:id/respond",
  authMiddleware,
  requireRole("volunteer", "donor"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { id: requestId } = c.req.param();
    const currentUser = c.get("user");

    try {
      const result = await responsesService.respondToRequest(db, requestId, currentUser.id);
      return c.json(result, result.warning ? 200 : 201);
    } catch (error: any) {
      const status = error.message.includes("already responding") ? 409 : 400;
      return c.json({ error: error.message }, error.message === "Request not found" ? 404 : status);
    }
  }
);

responsesController.patch(
  "/requests/:id/respond",
  authMiddleware,
  requireRole("volunteer", "donor"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { id: requestId } = c.req.param();
    const currentUser = c.get("user");
    const { status } = await c.req.json();

    try {
      const response = await responsesService.updateResponseStatus(
        db,
        requestId,
        currentUser.id,
        status
      );
      return c.json({ response });
    } catch (error: any) {
      return c.json({ error: error.message }, error.message.includes("not found") ? 404 : 400);
    }
  }
);

responsesController.delete(
  "/requests/:id/respond",
  authMiddleware,
  requireRole("volunteer", "donor"),
  async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { id: requestId } = c.req.param();
    const currentUser = c.get("user");

    try {
      await responsesService.withdrawResponse(db, requestId, currentUser.id);
      return c.json({ message: "Response withdrawn" });
    } catch (error: any) {
      return c.json({ error: error.message }, 404);
    }
  }
);

responsesController.get("/requests/:id/volunteers", authMiddleware, async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { id: requestId } = c.req.param();

  const result = await responsesService.getVolunteers(db, requestId);
  return c.json(result);
});
