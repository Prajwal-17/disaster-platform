import { DurableObject } from "cloudflare:workers";
import { jwtVerify, createRemoteJWKSet } from "jose";
import type { CloudflareBindings, WSConnectionState, WSEvent } from "../types";
import { WS_EVENT } from "../types";

/**
 * DisasterCoordination Durable Object
 *
 * One instance per incident, keyed by incidentId.
 * Manages all WebSocket connections for a disaster zone in real-time.
 *
 * Uses CF Hibernation API (ctx.acceptWebSocket) so the DO sleeps when
 * no messages are in flight — connections are preserved across hibernation.
 *
 * Responsibilities:
 *  1. Authenticate the WS upgrade request (JWT from query param)
 *  2. Broadcast resource request events to all subscribers in the incident
 *  3. Relay live location pings to nearby peers
 *  4. Handle cleanup on disconnect
 */
export class DisasterCoordination extends DurableObject<CloudflareBindings> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const incidentId = url.searchParams.get("incidentId");

    if (!token || !incidentId) {
      return new Response("Missing token or incidentId", { status: 400 });
    }

    // Verify JWT before upgrading
    let payload: { id: string; email: string; role: string };
    try {
      const JWKS = createRemoteJWKSet(
        new URL(`${this.env.BETTER_AUTH_URL}/api/auth/jwks`)
      );
      const { payload: p } = await jwtVerify(token, JWKS, {
        issuer: this.env.BETTER_AUTH_URL,
        audience: this.env.BETTER_AUTH_URL,
      });
      payload = p as typeof payload;
    } catch {
      return new Response("Invalid or expired token", { status: 401 });
    }

    // Upgrade to WebSocket
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server!);

    // Persist connection state (survives hibernation)
    const state: WSConnectionState = {
      userId: payload.id,
      role: payload.role as WSConnectionState["role"],
      incidentId,
    };
    server!.serializeAttachment(state);

    // Notify the client they're connected
    server!.send(
      JSON.stringify({
        type: WS_EVENT.SUBSCRIBED,
        incidentId,
        message: "Connected to disaster coordination channel",
      })
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  // ─── Incoming Messages ──────────────────────────────────────────────────────

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    let data: { type: WSEvent; [key: string]: unknown };

    try {
      data = JSON.parse(message as string);
    } catch {
      ws.send(JSON.stringify({ type: WS_EVENT.ERROR, message: "Invalid JSON" }));
      return;
    }

    const state = ws.deserializeAttachment() as WSConnectionState;

    switch (data.type) {
      // ── Broadcast: a new request was created in this incident ──────────────
      case WS_EVENT.REQUEST_CREATE: {
        this.broadcastToIncident(state.userId, {
          type: WS_EVENT.REQUEST_CREATED,
          request: data.request,
          createdBy: state.userId,
        });
        break;
      }

      // ── Broadcast: request status / volunteer count changed ────────────────
      case WS_EVENT.REQUEST_UPDATE: {
        this.broadcastToIncident(state.userId, {
          type: WS_EVENT.REQUEST_UPDATED,
          requestId: data.requestId,
          changes: data.changes,
          updatedBy: state.userId,
        });
        break;
      }

      // ── Volunteer status update (en_route / arrived) ───────────────────────
      case WS_EVENT.VOLUNTEER_UPDATE: {
        this.broadcastToIncident(state.userId, {
          type: WS_EVENT.REQUEST_UPDATED,
          requestId: data.requestId,
          volunteerUpdate: {
            userId: state.userId,
            status: data.status,
            volunteerCount: data.volunteerCount,
            warning: data.warning ?? null,
          },
        });
        break;
      }

      // ── Live location ping — relay to all others in incident ───────────────
      case WS_EVENT.LOCATION_PING: {
        this.broadcastToIncident(state.userId, {
          type: WS_EVENT.PEER_LOCATION,
          userId: state.userId,
          role: state.role,
          lat: data.lat,
          lng: data.lng,
          timestamp: Date.now(),
        });
        break;
      }

      default: {
        ws.send(
          JSON.stringify({
            type: WS_EVENT.ERROR,
            message: `Unknown event type: ${data.type}`,
          })
        );
      }
    }
  }

  // ─── Disconnect ─────────────────────────────────────────────────────────────

  webSocketClose(ws: WebSocket): void {
    const state = ws.deserializeAttachment() as WSConnectionState | null;
    if (!state) return;

    // Notify remaining peers that this user left
    this.broadcastToIncident(state.userId, {
      type: WS_EVENT.REQUEST_UPDATED,
      system: true,
      message: `User ${state.userId} disconnected`,
      userId: state.userId,
    });
  }

  webSocketError(ws: WebSocket, error: unknown): void {
    console.error(`[DisasterCoordination] WebSocket error:`, error);
  }

  // ─── Broadcast Helper ───────────────────────────────────────────────────────

  /**
   * Send a message to all WebSocket connections in this DO instance
   * (i.e. all subscribers to this incident), excluding the sender.
   */
  broadcastToIncident(senderId: string, payload: object): void {
    const sockets = this.ctx.getWebSockets();

    for (const socket of sockets) {
      const state = socket.deserializeAttachment() as WSConnectionState | null;
      if (!state || state.userId === senderId) continue;

      try {
        socket.send(JSON.stringify(payload));
      } catch {
        // Socket may have closed between getWebSockets() and send()
      }
    }
  }
}
