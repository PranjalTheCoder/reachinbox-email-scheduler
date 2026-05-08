import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 chars"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_CALLBACK_URL: z.string().url(),
  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASS: z.string().optional(),
  WORKER_CONCURRENCY: z.string().default("5"),
  MAX_EMAILS_PER_HOUR: z.string().default("200"),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.string().default("100"),
  MIN_DELAY_BETWEEN_EMAILS: z.string().default("2000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  databaseUrl: parsed.data.DATABASE_URL,
  redis: {
    host: parsed.data.REDIS_HOST,
    port: parseInt(parsed.data.REDIS_PORT, 10),
  },
  jwt: { secret: parsed.data.JWT_SECRET },
  session: { secret: parsed.data.SESSION_SECRET },
  google: {
    clientId: parsed.data.GOOGLE_CLIENT_ID,
    clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
    callbackUrl: parsed.data.GOOGLE_CALLBACK_URL,
  },
  ethereal: {
    user: parsed.data.ETHEREAL_USER,
    pass: parsed.data.ETHEREAL_PASS,
  },
  worker: {
    concurrency: parseInt(parsed.data.WORKER_CONCURRENCY, 10),
    maxEmailsPerHour: parseInt(parsed.data.MAX_EMAILS_PER_HOUR, 10),
    maxEmailsPerHourPerSender: parseInt(parsed.data.MAX_EMAILS_PER_HOUR_PER_SENDER, 10),
    minDelayBetweenEmails: parseInt(parsed.data.MIN_DELAY_BETWEEN_EMAILS, 10),
  },
  frontendUrl: parsed.data.FRONTEND_URL,
} as const;
