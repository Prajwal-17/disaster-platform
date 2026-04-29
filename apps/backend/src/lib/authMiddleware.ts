import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, jwt } from "better-auth/plugins";
import { getDb } from "../db";
import * as schema from "../db/schema";
import type { CloudflareBindings } from "../types";

/**
 * Creates a Better Auth instance per request.
 *
 * MUST be a factory — not a module-level singleton — because CF Workers
 * env bindings (DATABASE_URL, secrets) are only available at request time.
 *
 * Plugins used:
 *  - emailAndPassword  — sign-up / sign-in with email + password
 *  - jwt               — issues a short-lived EdDSA JWT from the active session
 *                        (accessible at GET /api/auth/token after sign-in)
 *  - bearer            — allows getSession() to accept Authorization: Bearer <token>
 *                        so the JWT can be used to authenticate protected routes
 */
export function createAuth(env: CloudflareBindings) {
  const db = getDb(env.DATABASE_URL);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      // Map Better Auth's expected table names to our Drizzle schema
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        jwks: schema.jwks,
      },
      usePlural: false,
    }),

    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    // Email + Password auth
    emailAndPassword: {
      enabled: true,
      // Don't require email verification for hackathon
      requireEmailVerification: false,
    },

    // Expose `role` as a field on the user object
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "volunteer",
          // Allow user to set role at registration
          input: true,
        },
      },
    },

    plugins: [
      // Generates a signed EdDSA JWT from the active session.
      // Stores JWKS in the `jwks` table (needed for verification).
      // Client calls GET /api/auth/token to get the JWT after sign-in.
      jwt({
        jwt: {
          // Only embed what we need in the token payload
          definePayload: ({ user }) => ({
            id: user.id,
            email: user.email,
            role: (user as any).role ?? "volunteer",
          }),
          expirationTime: "7d",
        },
        jwks: {
          // EdDSA / Ed25519 — efficient and CF Workers compatible
          keyPairConfig: { alg: "EdDSA", crv: "Ed25519" },
        },
      }),

      // Allows auth.api.getSession() to parse the JWT from
      // the Authorization: Bearer <token> header instead of only cookies.
      bearer(),
    ],

    // Trust the frontend origin for CORS / cookies
    trustedOrigins: [env.FRONTEND_URL],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
