"use client";
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const qc = useQueryClient();

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5000";
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => console.log("WebSocket connected");
    ws.onclose = () => {
      setTimeout(connect, 3000);
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
  }, [qc]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);
}
