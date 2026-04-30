import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/authMiddleware";
import { DisasterCoordination } from "./lib/coordination";
import { incidentsController } from "./modules/incidents/incidents.controller";
import { locationController } from "./modules/location/location.controller";
import { requestsController } from "./modules/requests/requests.controller";
import { responsesController } from "./modules/responses/responses.controller";
import { wsController } from "./modules/ws/ws.controller";
import { aiController } from "./modules/ai/ai.controller";
import type { CloudflareBindings } from "./types";

// context binding from hono -> cf
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "set-auth-jwt"],
    maxAge: 600,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// auth endpoint
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return createAuth(c.env).handler(c.req.raw);
});

app.route("/api/incidents", incidentsController);
app.route("/api", requestsController);
app.route("/api", responsesController);
app.route("/api/location", locationController);
app.route("/api/ws", wsController);
app.route("/api/ai", aiController);

app.get("/", (c) =>
  c.json({ status: "ok", service: "disaster-coordination-api" }),
);

export { DisasterCoordination };
export default app;
