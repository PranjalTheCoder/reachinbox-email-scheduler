import { EmailStatus, EmailEventType, CampaignStatus } from "@prisma/client";

export type { EmailStatus, EmailEventType, CampaignStatus };

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar: string;
    googleId: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// ─── Email Job Types ─────────────────────────────────────────────────────────

export interface ScheduleEmailsInput {
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
}

export interface ScheduleResult {
  scheduled: number;
  skipped: number;
  jobIds: string[];
}

export interface EmailJobData {
  emailJobId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  htmlBody: string;
  senderId: string;
  senderEmail: string;
  idempotencyKey: string;
  priority: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── CSV Parse ───────────────────────────────────────────────────────────────

export interface ParseResult {
  emails: Array<{ email: string; name: string }>;
  total: number;
  valid: number;
  invalid: number;
}

// ─── Rate Limit ──────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  senderCount?: number;
  globalCount?: number;
}

// ─── Queue Stats ─────────────────────────────────────────────────────────────

export interface QueueStats {
  waiting: number;
  delayed: number;
  active: number;
  completed: number;
  failed: number;
}
