import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { QUEUE_NAME } from "../constants";
import type { EmailJobData } from "../types";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("email-queue");

export { QUEUE_NAME };
export type { EmailJobData };

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
});

emailQueue.on("error", (err) => {
  log.error({ err }, "Queue error");
});

export async function scheduleEmail(data: EmailJobData, delayMs: number): Promise<string> {
  const jobId = `email-${data.idempotencyKey}`;

  const existing = await emailQueue.getJob(jobId);
  if (existing) {
    log.debug({ jobId }, "Job already exists — skipping duplicate");
    return existing.id ?? jobId;
  }

  const job = await emailQueue.add("send-email", data, {
    jobId,
    delay: delayMs,
    priority: data.priority,
  });

  log.info({ jobId: job.id, delayMs, recipient: data.recipientEmail }, "Job enqueued");
  return job.id ?? jobId;
}
