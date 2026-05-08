import { Request, Response } from "express";
import multer from "multer";
import {
  scheduleEmailBatch,
  parseUploadedFile,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
  getEmailEvents,
  getSenderStats,
} from "../services/email.service";
import { success, created, error, notFound } from "../lib/api-response";
import { MAX_FILE_SIZE } from "../constants";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("email-controller");

export async function scheduleEmails(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: string; email: string };

  try {
    const result = await scheduleEmailBatch({
      senderId: user.id,
      senderEmail: user.email,
      subject: req.body.subject,
      body: req.body.body,
      htmlBody: req.body.htmlBody,
      recipientEmails: req.body.recipientEmails,
      startTime: new Date(req.body.startTime),
      delayBetweenEmailsMs: req.body.delayBetweenEmailsMs ?? 2000,
      hourlyLimit: req.body.hourlyLimit ?? 100,
      campaignId: req.body.campaignId,
      priority: req.body.priority ?? 0,
    });

    created(res, result, "Emails scheduled");
  } catch (err) {
    log.error({ err }, "Failed to schedule emails");
    error(res, "Failed to schedule emails", 500);
  }
}

export async function parseCSV(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    error(res, "No file uploaded", 400);
    return;
  }
  try {
    const result = await parseUploadedFile(req.file.buffer, req.file.mimetype);
    success(res, result, "File parsed");
  } catch (err) {
    log.error({ err }, "Failed to parse CSV");
    error(res, "Failed to parse file", 500);
  }
}

export async function getScheduled(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: string };
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const result = await getScheduledEmails(user.id, page, limit);
  success(res, result, "Scheduled emails fetched");
}

export async function getSent(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: string };
  const page = parseInt(String(req.query.page ?? "1"), 10);
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const result = await getSentEmails(user.id, page, limit);
  success(res, result, "Sent emails fetched");
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: string };
  const job = await getEmailById(req.params.id, user.id);
  if (!job) {
    notFound(res, "Email job not found");
    return;
  }
  success(res, job, "Email job fetched");
}

export async function getEvents(req: Request, res: Response): Promise<void> {
  const events = await getEmailEvents(req.params.id);
  success(res, events, "Events fetched");
}

export async function getStats(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: string };
  const stats = await getSenderStats(user.id);
  success(res, stats, "Stats fetched");
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "text/plain" ||
      file.originalname.endsWith(".csv") ||
      file.originalname.endsWith(".txt")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV or TXT files are allowed"));
    }
  },
});
