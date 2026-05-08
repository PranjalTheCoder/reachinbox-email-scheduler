# ReachInbox Email Scheduler

A production-grade email scheduling platform built for the ReachInbox hiring assignment.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | TypeScript · Express.js · Prisma ORM |
| Queue | BullMQ · Redis |
| Database | PostgreSQL (Supabase) |
| Email | Nodemailer · Ethereal Email |
| Auth | Passport.js · Google OAuth 2.0 · JWT |
| Frontend | Next.js 14 (App Router) · Tailwind CSS · React Query |
| Realtime | WebSocket (live stats updates) |
| Monitoring | Bull Board (`/admin/queues`) |

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Google Cloud OAuth credentials
- (Optional) Ethereal Email account — auto-created if not provided

### 2. Clone and setup env

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env — fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
```

### 3. Run with Docker

```bash
docker-compose up --build
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Bull Board**: http://localhost:5000/admin/queues
- **Health**: http://localhost:5000/health

### 4. Run locally (without Docker)

```bash
# Terminal 1: Start Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2: Start Postgres
docker run -e POSTGRES_USER=reachinbox -e POSTGRES_PASSWORD=reachinbox_pass -e POSTGRES_DB=reachinbox_db -p 5432:5432 postgres:15-alpine

# Terminal 3: Backend
cd apps/backend
npm install
npx prisma migrate dev
npm run dev

# Terminal 4: Frontend
cd apps/frontend
npm install
npm run dev
```

---

## Architecture

### Scheduling Flow

```
User submits form
       │
       ▼
POST /emails/schedule
       │
       ▼
EmailService.scheduleEmailBatch()
  ├── Creates EmailJob records in DB (status: "scheduled")
  └── Calls emailQueue.add("send-email", data, { delay: N })
              │
              ▼
         BullMQ Queue (Redis-backed)
         Delayed job stored in Redis sorted set
              │
              ▼  (after delay expires)
         Email Worker (concurrency=5)
         ├── Idempotency check (DB status === "sent" → skip)
         ├── Rate limit check (Redis Lua script)
         │     └── Limit hit → reschedule to next hour, return
         ├── Mark status: "processing"
         ├── Wait MIN_DELAY_BETWEEN_EMAILS ms
         ├── Send via Nodemailer/Ethereal
         └── Mark status: "sent" + store previewUrl
```

### Persistence on Restart

BullMQ stores all jobs in Redis using a persistent sorted set (`bull:<queue>:delayed`). When the server restarts:

1. The BullMQ worker reconnects to Redis.
2. All delayed jobs that haven't fired yet remain in the sorted set with their original timestamps.
3. Jobs whose scheduled time has passed are immediately picked up by the worker.
4. **No jobs are lost or duplicated.**

### Idempotency

Each job is enqueued with a deterministic job ID: `email-<emailJobId>`. BullMQ will reject a second `add()` call for the same job ID if the job still exists. Additionally, the worker checks `emailJob.status === "sent"` before processing.

### Rate Limiting

```
Redis Lua script (atomic):
  - Key: rate:sender:<id>:<YYYY-MM-DD-HH>
  - Key: rate:global:<YYYY-MM-DD-HH>
  - Check sender count < MAX_EMAILS_PER_HOUR_PER_SENDER
  - Check global count < MAX_EMAILS_PER_HOUR
  - If either limit exceeded → return false + msUntilNextHour
  - Else → INCR both keys + return true
```

When rate-limited, the job is **not failed** — it is re-enqueued with `delay = msUntilNextHour()` so it automatically fires in the next window.

### Concurrency

```env
WORKER_CONCURRENCY=5       # number of parallel email sends
MIN_DELAY_BETWEEN_EMAILS=2000  # ms throttle between sends
```

The BullMQ `limiter` option enforces a maximum of `WORKER_CONCURRENCY` jobs processed per `MIN_DELAY_BETWEEN_EMAILS` millisecond window across all worker instances.

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret (min 16 chars) | required |
| `SESSION_SECRET` | Express session secret | required |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | required |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | required |
| `ETHEREAL_USER` | Ethereal SMTP username | auto-created |
| `ETHEREAL_PASS` | Ethereal SMTP password | auto-created |
| `WORKER_CONCURRENCY` | Parallel email workers | `5` |
| `MAX_EMAILS_PER_HOUR` | Global hourly email cap | `200` |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | Per-sender hourly cap | `100` |
| `MIN_DELAY_BETWEEN_EMAILS` | Ms between sends | `2000` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |

### Frontend (`apps/frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL |

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/google` | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | OAuth callback |
| `GET` | `/auth/me` | Get current user |
| `POST` | `/auth/logout` | Sign out |

### Emails

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/emails/schedule` | Schedule email batch |
| `POST` | `/emails/parse-csv` | Parse CSV/TXT upload |
| `GET` | `/emails/scheduled` | List scheduled emails |
| `GET` | `/emails/sent` | List sent emails |
| `GET` | `/emails/:id` | Get email by ID |
| `GET` | `/health` | Queue health stats |

### Schedule Email Payload

```json
{
  "subject": "Hello World",
  "body": "<p>Email content</p>",
  "recipientEmails": ["user@example.com"],
  "startTime": "2024-01-15T10:00:00.000Z",
  "delayBetweenEmailsMs": 2000,
  "hourlyLimit": 100
}
```

---

## Features Implemented

### Backend
- [x] BullMQ delayed job scheduling (no cron)
- [x] Persistence across server restarts (Redis AOF + BullMQ)
- [x] Idempotency (deterministic job IDs + DB status checks)
- [x] Redis-backed rate limiting (per-sender + global, atomic Lua)
- [x] Configurable worker concurrency
- [x] Min delay between sends (BullMQ limiter + sleep)
- [x] Rate limit exceeded → reschedule to next hour (no job loss)
- [x] Exponential backoff retry (5 attempts)
- [x] CSV/TXT email parsing with validation
- [x] Ethereal SMTP integration + preview URL storage
- [x] Google OAuth + JWT authentication
- [x] Bull Board queue monitor at `/admin/queues`
- [x] WebSocket live stats broadcast
- [x] Prisma ORM with PostgreSQL
- [x] Zod env validation

### Frontend
- [x] Google OAuth login page
- [x] Dashboard with user info in header
- [x] Compose email modal with CSV upload
- [x] Email address parsing preview
- [x] Scheduled emails table with pagination
- [x] Sent emails table with Ethereal preview links
- [x] Real-time stats cards (queue health)
- [x] WebSocket live updates
- [x] Loading states / skeleton loaders
- [x] Empty states
- [x] Toast notifications
- [x] Responsive design

---

## Behavior Under Load

When 1000+ emails are scheduled simultaneously:

1. `scheduleEmailBatch()` creates DB records and enqueues BullMQ delayed jobs with staggered delays (`i * delayBetweenEmailsMs`).
2. Jobs become active as their delays expire, processed at `WORKER_CONCURRENCY` in parallel.
3. The BullMQ limiter caps throughput to avoid SMTP flooding.
4. Per-sender and global Redis counters track hourly usage.
5. When a limit is hit, the job is re-queued for the next hour — **no job is dropped**.
6. Order is preserved as much as possible via the staggered delay approach.

## Demo Steps

1. Open http://localhost:3000 → login with Google
2. Click "Compose Email" → fill subject/body
3. Upload a CSV (one email per line)
4. Set start time ~1 minute in the future
5. Click "Schedule"
6. Watch the **Scheduled** tab populate
7. After the start time passes, watch emails move to **Sent** tab
8. Click "View" links to see Ethereal previews
9. **Restart test**: Stop backend → restart → emails scheduled for the future still send
