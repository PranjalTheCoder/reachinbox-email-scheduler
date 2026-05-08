import { Worker, Job } from "bullmq";
import { EmailStatus, EmailEventType } from "@prisma/client";
import { redisConnection } from "../config/redis";
import { QUEUE_NAME, emailQueue } from "../queues/email.queue";
import { emailRepository } from "../repositories/email.repository";
import { getTransporter, getPreviewUrl } from "../config/nodemailer";
import { RateLimiter } from "../utils/rateLimiter";
import { env } from "../config/env";
import { createChildLogger } from "../lib/logger";
import { broadcastStats } from "../utils/websocket";
import type { EmailJobData } from "../types";

const log = createChildLogger("email-worker");
const rateLimiter = new RateLimiter(redisConnection);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      const {
        emailJobId,
        recipientEmail,
        recipientName,
        subject,
        body,
        htmlBody,
        senderId,
        senderEmail,
        idempotencyKey,
      } = job.data;

      // ── 1. Idempotency check ──────────────────────────────────────────────
      const existing = await emailRepository.findById(emailJobId);
      if (!existing) {
        log.warn({ emailJobId }, "EmailJob not found in DB — skipping");
        return;
      }
      if (existing.status === EmailStatus.sent) {
        log.info({ emailJobId }, "Already sent — skipping duplicate");
        return;
      }

      // ── 2. Rate limit check ────────────────────────────────────────────────
      const rl = await rateLimiter.consume(senderId);
      if (!rl.allowed) {
        log.info({ senderId, retryAfterMs: rl.retryAfterMs }, "Rate limit hit — rescheduling");

        await emailRepository.markRateLimited(emailJobId);
        await emailRepository.createEvent(emailJobId, EmailEventType.rate_limited, {
          retryAfterMs: rl.retryAfterMs,
        });

        await emailQueue.add("send-email", job.data, {
          jobId: `email-${idempotencyKey}-retry-${Date.now()}`,
          delay: rl.retryAfterMs,
          priority: job.data.priority,
        });
        return;
      }

      // ── 3. Mark as processing ──────────────────────────────────────────────
      await emailRepository.markProcessing(emailJobId);
      await emailRepository.createEvent(emailJobId, EmailEventType.processing);

      // ── 4. Min delay throttle ──────────────────────────────────────────────
      await sleep(env.worker.minDelayBetweenEmails);

      // ── 5. Send email ──────────────────────────────────────────────────────
      const transporter = await getTransporter();
      const info = await transporter.sendMail({
        from: `"${recipientName || "ReachInbox"}" <${senderEmail}>`,
        to: recipientEmail,
        subject,
        html: htmlBody || body,
      });

      const previewUrl = getPreviewUrl(info);
      log.info({ recipientEmail, previewUrl }, "Email sent");

      // ── 6. Persist success ─────────────────────────────────────────────────
      await emailRepository.markSent(emailJobId, previewUrl ?? "", info.messageId);
      await emailRepository.createEvent(emailJobId, EmailEventType.sent, {
        previewUrl,
        messageId: info.messageId,
      });

      await broadcastStats(senderId);
    },
    {
      connection: redisConnection,
      concurrency: env.worker.concurrency,
      limiter: {
        max: env.worker.concurrency,
        duration: env.worker.minDelayBetweenEmails,
      },
    }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const { emailJobId, senderId } = job.data;
    log.error({ jobId: job.id, emailJobId, err: err.message }, "Job failed");

    await emailRepository.createEvent(emailJobId, EmailEventType.failed, {
      error: err.message,
      attempt: job.attemptsMade,
    });

    if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
      await emailRepository.markFailed(emailJobId, err.message, job.attemptsMade);
      await broadcastStats(senderId);
    }
  });

  worker.on("error", (err) => log.error({ err }, "Worker error"));

  worker.on("completed", (job) => {
    log.debug({ jobId: job.id }, "Job completed");
  });

  log.info(
    { concurrency: env.worker.concurrency, minDelay: env.worker.minDelayBetweenEmails, maxPerHour: env.worker.maxEmailsPerHour },
    "Email worker started"
  );

  return worker;
}
