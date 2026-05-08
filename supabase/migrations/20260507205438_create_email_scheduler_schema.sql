# Add Docker compose and Supabase/Prisma schemas
git add docker-compose.yml supabase/
git add apps/backend/Dockerfile apps/backend/prisma/
git commit -m "setup: add docker infrastructure and database schemas"/*
  # Email Scheduler Schema

  1. New Tables
    - `users` - Google OAuth users
    - `email_jobs` - scheduled/sent email records
    - `rate_limit_windows` - hourly rate tracking per sender

  2. Security
    - RLS enabled on all tables
    - Users access only their own data
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Email status enum
DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('scheduled', 'queued', 'processing', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Email jobs table
CREATE TABLE IF NOT EXISTS email_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  scheduled_time timestamptz NOT NULL,
  sent_time timestamptz,
  status email_status NOT NULL DEFAULT 'scheduled',
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_email text NOT NULL DEFAULT '',
  retry_count int NOT NULL DEFAULT 0,
  bull_job_id text,
  preview_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_sender_id ON email_jobs(sender_id);
CREATE INDEX IF NOT EXISTS idx_email_jobs_status ON email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_email_jobs_scheduled_time ON email_jobs(scheduled_time);

ALTER TABLE email_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email jobs"
  ON email_jobs FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can insert own email jobs"
  ON email_jobs FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own email jobs"
  ON email_jobs FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Rate limit windows table
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hour_window text NOT NULL,
  sent_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, hour_window)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_sender_hour ON rate_limit_windows(sender_id, hour_window);

ALTER TABLE rate_limit_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON rate_limit_windows FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_jobs_updated_at ON email_jobs;
CREATE TRIGGER email_jobs_updated_at
  BEFORE UPDATE ON email_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
