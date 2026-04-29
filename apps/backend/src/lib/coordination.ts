import { DurableObject } from "cloudflare:workers";
import { jwtVerify, createRemoteJWKSet } from "jose";
import type { CloudflareBindings, WSConnectionState, WSEvent, ChatMessage } from "../types";
import { WS_EVENT } from "../types";

const MAX_CHAT_HISTORY = 50;
const CHAT_STORAGE_KEY = "chat_messages";

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
 *  5. Incident-scoped live chat with message history
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
    let payload: { id: string; email: string; role: string; name?: string };
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
      userName: payload.name || payload.email || "Anonymous",
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

    // Send chat history to new joiner
    const history = await this.getChatHistory();
    if (history.length > 0) {
      server!.send(
        JSON.stringify({
          type: WS_EVENT.CHAT_HISTORY,
          messages: history,
        })
      );
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  // ─── Incoming Messages ──────────────────────────────────────────────────────

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
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

      // ── Chat message — store + broadcast ───────────────────────────────────
      case WS_EVENT.CHAT_MESSAGE: {
        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (!text || text.length > 500) {
          ws.send(
            JSON.stringify({
              type: WS_EVENT.ERROR,
              message: "Chat message must be 1-500 characters",
            })
          );
          break;
        }

        const chatMsg: ChatMessage = {
          id: crypto.randomUUID(),
          userId: state.userId,
          userName: state.userName,
          role: state.role,
          text,
          timestamp: Date.now(),
        };

        // Store in DO storage
        await this.storeChatMessage(chatMsg);

        // Broadcast to ALL (including sender for confirmation)
        this.broadcastToAll({
          type: WS_EVENT.CHAT_BROADCAST,
          message: chatMsg,
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

  // ─── Broadcast Helpers ──────────────────────────────────────────────────────

  /**
   * Send a message to all WebSocket connections in this DO instance,
   * excluding the sender.
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

  /**
   * Send a message to ALL WebSocket connections (including sender).
   * Used for chat so sender gets confirmation.
   */
  broadcastToAll(payload: object): void {
    const sockets = this.ctx.getWebSockets();
    const msg = JSON.stringify(payload);

    for (const socket of sockets) {
      try {
        socket.send(msg);
      } catch {
        // Socket may have closed
      }
    }
  }

  // ─── Chat Storage ───────────────────────────────────────────────────────────

  async getChatHistory(): Promise<ChatMessage[]> {
    const stored = await this.ctx.storage.get<ChatMessage[]>(CHAT_STORAGE_KEY);
    return stored ?? [];
  }

  async storeChatMessage(msg: ChatMessage): Promise<void> {
    const history = await this.getChatHistory();
    history.push(msg);

    // Keep only last N messages
    const trimmed =
      history.length > MAX_CHAT_HISTORY
        ? history.slice(-MAX_CHAT_HISTORY)
        : history;

    await this.ctx.storage.put(CHAT_STORAGE_KEY, trimmed);
  }
}
