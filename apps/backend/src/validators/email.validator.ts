import { z } from "zod";

export const scheduleEmailsSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(255, "Subject too long"),
  body: z.string().min(1, "Body is required"),
  htmlBody: z.string().optional(),
  recipientEmails: z
    .array(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().optional().default(""),
      })
    )
    .min(1, "At least one recipient is required")
    .max(10000, "Maximum 10,000 recipients per batch"),
  startTime: z.string().datetime("Invalid start time format"),
  delayBetweenEmailsMs: z.number().int().min(0).default(2000),
  hourlyLimit: z.number().int().min(1).max(10000).default(100),
  campaignId: z.string().uuid().optional(),
  priority: z.number().int().min(0).max(10).default(0),
});

export type ScheduleEmailsInput = z.infer<typeof scheduleEmailsSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const emailIdParamSchema = z.object({
  id: z.string().uuid("Invalid email ID"),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().default(""),
});

export const createSenderSchema = z.object({
  senderName: z.string().min(1).max(255),
  senderEmail: z.string().email(),
  smtpHost: z.string().min(1).default("smtp.ethereal.email"),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpUser: z.string().optional().default(""),
  smtpPasswordEncrypted: z.string().optional().default(""),
  dailyLimit: z.number().int().min(1).default(500),
  hourlyLimit: z.number().int().min(1).default(100),
});
