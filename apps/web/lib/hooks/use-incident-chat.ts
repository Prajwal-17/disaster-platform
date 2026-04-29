"use client";

/**
 * useIncidentChat — WebSocket hook for incident-scoped live chat.
 *
 * Connects to the Durable Object WS endpoint, manages messages,
 * handles reconnection, and exposes send/state to components.
 */
import { useEffect, useRef, useState, useCallback } from "react";

export type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  role: string;
  text: string;
  timestamp: number;
};

type UseChatOptions = {
  incidentId: string;
  enabled?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

async function getWSToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/token`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      return data.token ?? null;
    }
  } catch {
    // no token
  }
  return null;
}

export function useIncidentChat({ incidentId, enabled = true }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isVisibleRef = useRef(true);

  // Track visibility for unread count
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          type: "CHAT_MESSAGE",
          text,
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !incidentId) return;

    let cancelled = false;

    async function connect() {
      const token = await getWSToken();
      if (!token || cancelled) return;

      // Build WS URL
      const wsBase = API_BASE.replace(/^http/, "ws");
      const url = `${wsBase}/api/ws/${incidentId}?token=${token}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) setIsConnected(true);
      };

      ws.onmessage = (e) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(e.data);

          if (data.type === "CHAT_BROADCAST" && data.message) {
            setMessages((prev) => [...prev, data.message as ChatMessage]);
            if (!isVisibleRef.current) {
              setUnreadCount((c) => c + 1);
            }
          }

          if (data.type === "CHAT_HISTORY" && Array.isArray(data.messages)) {
            setMessages(data.messages as ChatMessage[]);
          }
        } catch {
          // invalid message
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setIsConnected(false);
          // Auto-reconnect after 3s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!cancelled) connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [incidentId, enabled]);

  return {
    messages,
    isConnected,
    sendMessage,
    unreadCount,
    markAsRead,
    setIsVisible: (v: boolean) => {
      isVisibleRef.current = v;
    },
  };
}
