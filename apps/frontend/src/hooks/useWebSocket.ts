"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket(enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(enabled);
  const qc = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled || wsRef.current) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5000";
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => console.log("WebSocket connected");
    ws.onclose = () => {
      wsRef.current = null;

      if (!shouldReconnectRef.current) return;

      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { event: string; data: unknown };
        if (msg.event === "stats_update") {
          qc.invalidateQueries({ queryKey: ["emails"] });
        }
      } catch {
        // ignore malformed messages
      }
    };

    wsRef.current = ws;
  }, [enabled, qc]);

  useEffect(() => {
    shouldReconnectRef.current = enabled;

    if (!enabled) {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      const socket = wsRef.current;
      wsRef.current = null;
      socket?.close();
      return;
    }

    connect();

    return () => {
      shouldReconnectRef.current = false;

      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      const socket = wsRef.current;
      wsRef.current = null;
      socket?.close();
    };
  }, [connect, enabled]);
}
