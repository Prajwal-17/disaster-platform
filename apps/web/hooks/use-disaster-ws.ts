"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";

type WSMessage = {
  type: string;
  [key: string]: unknown;
};

type UseDisasterWSOptions = {
  incidentId: string;
  token: string | null;
  onMessage?: (msg: WSMessage) => void;
  enabled?: boolean;
};

export function useDisasterWS({
  incidentId,
  token,
  onMessage,
  enabled = true,
}: UseDisasterWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !token || !incidentId) return;

    const url = `${WS_BASE}/api/ws/${incidentId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as WSMessage;
        onMessageRef.current?.(data);
      } catch {
        // ignore invalid JSON
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [incidentId, token, enabled]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { connected, send };
}
