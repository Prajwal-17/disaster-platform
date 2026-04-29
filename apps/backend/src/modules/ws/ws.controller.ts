import { Hono } from "hono";
import { createAuth } from "../../lib/authMiddleware";
import type { HonoEnv } from "../../types";

export const wsController = new Hono<HonoEnv>();

wsController.get("/:incidentId", async (c) => {
  const { incidentId } = c.req.param();
  const token = c.req.query("token");

  if (!token) {
    return c.json({ error: "Missing token query parameter" }, 400);
  }

  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });

  if (!session) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  const doId = c.env.DISASTER_COORDINATION.idFromName(`incident-${incidentId}`);
  const stub = c.env.DISASTER_COORDINATION.get(doId);

  const url = new URL(c.req.url);
  url.searchParams.set("incidentId", incidentId);

  return stub.fetch(new Request(url.toString(), c.req.raw));
});
