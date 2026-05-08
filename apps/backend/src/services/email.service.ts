import { EmailStatus, EmailEventType } from "@prisma/client";
import { emailRepository } from "../repositories/email.repository";
import { campaignRepository } from "../repositories/campaign.repository";
import { scheduleEmail } from "../queues/email.queue";
import { parseEmailsFromBuffer } from "../utils/csvParser";
import { createChildLogger } from "../lib/logger";
import type { ScheduleResult, ParseResult } from "../types";

const log = createChildLogger("email-service");

export async function scheduleEmailBatch(input: {
  senderId: string;
  senderEmail: string;
  subject: string;
  body: string;
  htmlBody?: string;
  recipientEmails: Array<{ email: string; name?: string }>;
  startTime: Date;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  campaignId?: string;
  priority?: number;
}): Promise<ScheduleResult> {
  const {
    senderId,
    senderEmail,
    subject,
    body,
    htmlBody,
    recipientEmails,
    startTime,
    delayBetweenEmailsMs,
    campaignId,
    priority = 0,
  } = input;

  let scheduled = 0;
  let skipped = 0;
  const jobIds: string[] = [];

  // Create campaign if needed
  let campaign = campaignId
    ? await campaignRepository.findById(campaignId, senderId)
    : null;

  if (!campaign && recipientEmails.length > 1) {
    campaign = await campaignRepository.create({
      userId: senderId,
      name: subject,
      totalEmails: recipientEmails.length,
    });
  }

  for (let i = 0; i < recipientEmails.length; i++) {
    const { email, name } = recipientEmails[i];
    const scheduledTime = new Date(startTime.getTime() + i * delayBetweenEmailsMs);
    const delayMs = Math.max(0, scheduledTime.getTime() - Date.now());
    const idempotencyKey = `${senderId}:${email}:${scheduledTime.toISOString()}`;

    // Check idempotency
    const existing = await emailRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      log.debug({ emailJobId: existing.id }, "Skipping duplicate email job");
      skipped++;
      continue;
    }

    // Persist to DB
    const emailJob = await emailRepository.createJob({
      recipientEmail: email,
      recipientName: name ?? "",
      subject,
      body,
      htmlBody: htmlBody ?? body,
      scheduledTime,
      status: EmailStatus.scheduled,
      senderId,
      senderEmail,
      campaignId: campaign?.id,
      idempotencyKey,
      priority,
    });

    // Record event
    await emailRepository.createEvent(emailJob.id, EmailEventType.scheduled, {
      scheduledTime: scheduledTime.toISOString(),
      delayMs,
    });

    // Enqueue BullMQ job
    const bullJobId = await scheduleEmail(
      {
        emailJobId: emailJob.id,
        recipientEmail: email,
        recipientName: name ?? "",
        subject,
        body,
        htmlBody: htmlBody ?? body,
        senderId,
        senderEmail,
        idempotencyKey,
        priority,
      },
      delayMs
    );

    // Store bullJobId
    await emailRepository.updateStatus(emailJob.id, EmailStatus.queued, { bullJobId });

    // Record queued event
    await emailRepository.createEvent(emailJob.id, EmailEventType.queued, { bullJobId });

    scheduled++;
    jobIds.push(bullJobId);
  }

  // Update campaign status
  if (campaign) {
    await campaignRepository.updateStatus(campaign.id, "running");
  }

  log.info({ scheduled, skipped, senderId }, "Email batch scheduled");

  return { scheduled, skipped, jobIds };
}

export async function parseUploadedFile(buffer: Buffer, mimeType: string): Promise<ParseResult> {
  return parseEmailsFromBuffer(buffer, mimeType);
}

export async function getScheduledEmails(senderId: string, page: number, limit: number) {
  return emailRepository.getScheduledBySender(senderId, page, limit);
}

export async function getSentEmails(senderId: string, page: number, limit: number) {
  return emailRepository.getSentBySender(senderId, page, limit);
}

export async function getEmailById(id: string, senderId: string) {
  return emailRepository.findByIdAndSender(id, senderId);
}

export async function getEmailEvents(emailJobId: string) {
  return emailRepository.getEventsByJobId(emailJobId);
}

export async function getSenderStats(senderId: string) {
  return emailRepository.countBySender(senderId);
}
