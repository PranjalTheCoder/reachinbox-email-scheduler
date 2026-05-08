export const QUEUE_NAME = "email-scheduler";

export const EMAIL_STATUS = {
  SCHEDULED: "scheduled",
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
  RETRYING: "retrying",
  CANCELLED: "cancelled",
} as const;

export const EVENT_TYPES = {
  SCHEDULED: "scheduled",
  QUEUED: "queued",
  PROCESSING: "processing",
  SENT: "sent",
  FAILED: "failed",
  RETRYING: "retrying",
  CANCELLED: "cancelled",
  RATE_LIMITED: "rate_limited",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_RECIPIENTS_PER_BATCH = 10000;
