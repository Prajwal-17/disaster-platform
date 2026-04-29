import { createMiddleware } from "hono/factory";
import { createAuth } from "../lib/authMiddleware";
import type { HonoEnv, UserRole } from "../types";

/**
 * Auth middleware — validates the Bearer JWT (or session cookie) and
 * injects `user` and `session` into the Hono context.
 *
 * Better Auth's `bearer` plugin makes `getSession()` check both:
 *   - Cookie-based sessions (browser)
 *   - Authorization: Bearer <jwt> header (API / mobile / WS fallback)
 */
export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const auth = createAuth(c.env);

  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }

  c.set("user", session.user as HonoEnv["Variables"]["user"]);
  c.set("session", session.session);

  await next();
});

/**
 * Role guard — must be used AFTER authMiddleware.
 *
 * Usage:
 *   app.post("/incidents", authMiddleware, requireRole("ngo", "admin"), handler)
 */
export const requireRole = (...roles: UserRole[]) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get("user");
    const userRole = user.role as UserRole;

    if (!roles.includes(userRole)) {
      return c.json(
        {
          error: "Forbidden",
          code: "INSUFFICIENT_ROLE",
          required: roles,
          current: userRole,
        },
        403
      );
    }

    await next();
  });
