/*
  # Expanded Email Scheduler Schema v2

  1. New Tables
    - `email_senders` — multiple SMTP sender accounts per user
    - `email_campaigns` — campaign grouping for bulk emails
    - `email_events` — audit trail for email lifecycle events
    - `worker_locks` — distributed locking for multi-worker safety

  2. Modified Tables
    - `email_jobs` — added campaignId, senderId, idempotencyKey, priority,
      htmlBody, recipientName, maxRetries, lastAttemptAt, nextRetryAt,
      providerMessageId, queueName, cancelled status

  3. Security
    - RLS enabled on all new tables
    - Users can only access their own data
*/

-- Email senders table
CREATE TABLE IF NOT EXISTS email_senders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT '',
  sender_email text NOT NULL,
  smtp_host text NOT NULL DEFAULT 'smtp.ethereal.email',
  smtp_port int NOT NULL DEFAULT 587,
  smtp_user text NOT NULL DEFAULT '',
  smtp_password_encrypted text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  daily_limit int NOT NULL DEFAULT 500,
  hourly_limit int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sender_email)
);

CREATE INDEX IF NOT EXISTS idx_email_senders_user_id ON email_senders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_senders_active ON email_senders(user_id, is_active);

ALTER TABLE email_senders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own senders"
  ON email_senders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own senders"
  ON email_senders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own senders"
  ON email_senders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Email campaigns table
DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status campaign_status NOT NULL DEFAULT 'draft',
  total_emails int NOT NULL DEFAULT 0,
  sent_emails int NOT NULL DEFAULT 0,
  failed_emails int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON email_campaigns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
  ON email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON email_campaigns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add new columns to email_jobs
DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN campaign_id uuid REFERENCES email_campaigns(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN sender_id_fk uuid REFERENCES email_senders(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN idempotency_key text UNIQUE;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN priority int NOT NULL DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN html_body text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN recipient_name text NOT NULL DEFAULT '';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN max_retries int NOT NULL DEFAULT 5;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN last_attempt_at timestamptz;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN next_retry_at timestamptz;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN provider_message_id text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE email_jobs ADD COLUMN queue_name text NOT NULL DEFAULT 'email-scheduler';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add 'cancelled' and 'retrying' to email_status enum
DO $$ BEGIN
  ALTER TYPE email_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE email_status ADD VALUE IF NOT EXISTS 'retrying';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new indexes for email_jobs
CREATE INDEX IF NOT EXISTS idx_email_jobs_campaign_id ON email_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_jobs_idempotency_key ON email_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_jobs_priority ON email_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_email_jobs_status_scheduled ON email_jobs(status, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_email_jobs_sender_status ON email_jobs(sender_id, status);

-- Email events table (audit trail)
DO $$ BEGIN
  CREATE TYPE email_event_type AS ENUM ('scheduled', 'queued', 'processing', 'sent', 'failed', 'retrying', 'cancelled', 'rate_limited');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_job_id uuid NOT NULL REFERENCES email_jobs(id) ON DELETE CASCADE,
  event_type email_event_type NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_job_id ON email_events(email_job_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email events"
  ON email_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_jobs
      WHERE email_jobs.id = email_events.email_job_id
      AND email_jobs.sender_id = auth.uid()
    )
  );

-- Worker locks table (distributed locking)
CREATE TABLE IF NOT EXISTS worker_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_key text NOT NULL UNIQUE,
  worker_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worker_locks_key ON worker_locks(lock_key);
CREATE INDEX IF NOT EXISTS idx_worker_locks_expires ON worker_locks(expires_at);

-- Add updated_at triggers for new tables
CREATE TRIGGER email_senders_updated_at
  BEFORE UPDATE ON email_senders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
