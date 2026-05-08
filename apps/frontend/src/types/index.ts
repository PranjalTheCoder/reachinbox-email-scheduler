// ─── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Email Status ────────────────────────────────────────────────────────────

export type EmailStatus = "scheduled" | "queued" | "processing" | "sent" | "failed" | "retrying" | "cancelled";

// ─── Email Job ───────────────────────────────────────────────────────────────

export interface EmailJob {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  htmlBody: string | null;
  scheduledTime: string;
  sentTime: string | null;
  status: EmailStatus;
  senderId: string;
  senderEmail: string;
  senderIdFk: string | null;
  campaignId: string | null;
  retryCount: number;
  maxRetries: number;
  bullJobId: string | null;
  queueName: string;
  providerMessageId: string | null;
  previewUrl: string | null;
  errorMessage: string | null;
  priority: number;
  idempotencyKey: string | null;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Schedule Payload ────────────────────────────────────────────────────────

export interface ScheduleEmailsPayload {
  subject: string;
  body: string;
  htmlBody?: string;
  recipientEmails: Array<{ email: string; name?: string }>;
  startTime: string;
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

// ─── CSV Parse ───────────────────────────────────────────────────────────────

export interface ParseCSVResult {
  emails: Array<{ email: string; name: string }>;
  total: number;
  valid: number;
  invalid: number;
}

// ─── Queue Stats ─────────────────────────────────────────────────────────────

export interface QueueStats {
  waiting: number;
  delayed: number;
  active: number;
  completed: number;
  failed: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  queue: QueueStats;
}

// ─── Email Event ─────────────────────────────────────────────────────────────

export type EmailEventType = "scheduled" | "queued" | "processing" | "sent" | "failed" | "retrying" | "cancelled" | "rate_limited";

export interface EmailEvent {
  id: string;
  emailJobId: string;
  eventType: EmailEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Sender Stats ────────────────────────────────────────────────────────────

export interface SenderStats {
  scheduled: number;
  sent: number;
  failed: number;
}
