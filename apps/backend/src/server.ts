import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import { createClient } from "redis";
import RedisStore from "connect-redis";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { env } from "./config/env";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import emailRoutes from "./routes/emails";
import { errorHandler } from "./middlewares/errorHandler";
import { prisma } from "./config/prisma";
import { createEmailWorker } from "./workers/email.worker";
import { redisConnection } from "./config/redis";
import { emailQueue } from "./queues/email.queue";
import { setupWebSocket } from "./utils/websocket";
import { createChildLogger } from "./lib/logger";

const log = createChildLogger("server");

async function bootstrap() {
  const app = express();

  // ── Security ─────────────────────────────────────────────────────────────
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: [env.frontendUrl, "http://localhost:3000"],
      credentials: true,
    })
  );

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── Session ───────────────────────────────────────────────────────────────
  const redisClient = createClient({
    socket: { host: env.redis.host, port: env.redis.port },
  });
  await redisClient.connect();

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: env.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: env.nodeEnv === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ── Bull Board ────────────────────────────────────────────────────────────
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");
  createBullBoard({ queues: [new BullMQAdapter(emailQueue) as any], serverAdapter });
  app.use("/admin/queues", serverAdapter.getRouter());

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use("/auth", authRoutes);
  app.use("/emails", emailRoutes);

  app.get("/health", async (_req, res) => {
    const [waiting, delayed, active, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getDelayedCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);
    res.json({
      success: true,
      message: "OK",
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        queue: { waiting, delayed, active, completed, failed },
      },
    });
  });

  app.use(errorHandler);

  // ── HTTP + WebSocket ──────────────────────────────────────────────────────
  const server = http.createServer(app);
  setupWebSocket(server);

  // ── Worker ────────────────────────────────────────────────────────────────
  createEmailWorker();

  server.listen(env.port, () => {
    log.info(
      { port: env.port, env: env.nodeEnv, bullBoard: `http://localhost:${env.port}/admin/queues` },
      "Server started"
    );
  });

  const shutdown = async (signal: string) => {
    log.info({ signal }, "Shutting down gracefully");
    server.close();
    await prisma.$disconnect();
    await redisConnection.quit();
    await redisClient.quit();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  log.fatal({ err }, "Bootstrap failed");
  process.exit(1);
});
