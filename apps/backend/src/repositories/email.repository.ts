import { prisma } from "../config/prisma";
import { EmailStatus, EmailEventType } from "@prisma/client";
import type { EmailJobData } from "../types";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("email-repo");

export const emailRepository = {
  async createJob(data: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    body: string;
    htmlBody?: string;
    scheduledTime: Date;
    status: EmailStatus;
    senderId: string;
    senderEmail: string;
    senderIdFk?: string;
    campaignId?: string;
    idempotencyKey: string;
    priority?: number;
    maxRetries?: number;
    bullJobId?: string;
  }) {
    return prisma.emailJob.create({ data });
  },

  async findById(id: string) {
    return prisma.emailJob.findUnique({ where: { id } });
  },

  async findByIdAndSender(id: string, senderId: string) {
    return prisma.emailJob.findFirst({ where: { id, senderId } });
  },

  async findByIdempotencyKey(key: string) {
    return prisma.emailJob.findUnique({ where: { idempotencyKey: key } });
  },

  async updateStatus(
    id: string,
    status: EmailStatus,
    extra?: Record<string, unknown>,
  ) {
    return prisma.emailJob.update({
      where: { id },
      data: { status, ...extra },
    });
  },

  async markProcessing(id: string) {
    return prisma.emailJob.update({
      where: { id },
      data: { status: EmailStatus.processing, lastAttemptAt: new Date() },
    });
  },

  async markSent(id: string, previewUrl: string, providerMessageId?: string) {
    return prisma.emailJob.update({
      where: { id },
      data: {
        status: EmailStatus.sent,
        sentTime: new Date(),
        previewUrl,
        providerMessageId,
      },
    });
  },

  async markFailed(id: string, errorMessage: string, retryCount: number) {
    const isFinal = retryCount >= 5;
    return prisma.emailJob.update({
      where: { id },
      data: {
        status: isFinal ? EmailStatus.failed : EmailStatus.retrying,
        errorMessage,
        retryCount,
        nextRetryAt: isFinal
          ? undefined
          : new Date(Date.now() + 2 ** retryCount * 2000),
      },
    });
  },

  async markRateLimited(id: string) {
    return prisma.emailJob.update({
      where: { id },
      data: { status: EmailStatus.scheduled },
    });
  },

  async getScheduledBySender(senderId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      senderId,
      status: {
        in: [
          EmailStatus.scheduled,
          EmailStatus.queued,
          EmailStatus.processing,
          EmailStatus.retrying,
        ],
      },
    };
    const [items, total] = await Promise.all([
      prisma.emailJob.findMany({
        where,
        orderBy: [{ priority: "desc" }, { scheduledTime: "asc" }],
        skip,
        take: limit,
      }),
      prisma.emailJob.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getSentBySender(senderId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      senderId,
      status: { in: [EmailStatus.sent, EmailStatus.failed] },
    };
    const [items, total] = await Promise.all([
      prisma.emailJob.findMany({
        where,
        orderBy: { sentTime: "desc" },
        skip,
        take: limit,
      }),
      prisma.emailJob.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async countBySender(senderId: string) {
    const [scheduled, sent, failed] = await Promise.all([
      prisma.emailJob.count({
        where: {
          senderId,
          status: {
            in: [
              EmailStatus.scheduled,
              EmailStatus.queued,
              EmailStatus.processing,
            ],
          },
        },
      }),
      prisma.emailJob.count({ where: { senderId, status: EmailStatus.sent } }),
      prisma.emailJob.count({
        where: { senderId, status: EmailStatus.failed },
      }),
    ]);
    return { scheduled, sent, failed };
  },

  // ─── Events ──────────────────────────────────────────────────────────────

  async createEvent(
    emailJobId: string,
    eventType: EmailEventType,
    metadata: Record<string, unknown> = {},
  ) {
    return prisma.emailEvent.create({
      data: { emailJobId, eventType, metadata: metadata as any },
    });
  },

  async getEventsByJobId(emailJobId: string) {
    return prisma.emailEvent.findMany({
      where: { emailJobId },
      orderBy: { createdAt: "desc" },
    });
  },
};
