import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "../config/prisma";

let wss: WebSocketServer | null = null;

export function setupWebSocket(server: HttpServer): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");
    ws.on("error", console.error);
    ws.on("close", () => console.log("WebSocket client disconnected"));
  });

  console.log("WebSocket server ready at /ws");
}

export function broadcast(event: string, data: unknown): void {
  if (!wss) return;
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export async function broadcastStats(senderId: string): Promise<void> {
  const [scheduled, sent, failed] = await Promise.all([
    prisma.emailJob.count({
      where: { senderId, status: { in: ["scheduled", "queued", "processing"] } },
    }),
    prisma.emailJob.count({ where: { senderId, status: "sent" } }),
    prisma.emailJob.count({ where: { senderId, status: "failed" } }),
  ]);

  broadcast("stats_update", { senderId, scheduled, sent, failed });
}
