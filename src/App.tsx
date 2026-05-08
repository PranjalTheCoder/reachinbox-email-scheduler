import {
  Mail,
  Zap,
  Shield,
  Clock,
  Database,
  Server,
  Monitor,
  CheckCircle,
  ArrowRight,
  SendHorizonal,
  CalendarClock,
  Upload,
  RefreshCcw,
} from "lucide-react";

const stack = [
  { label: "Express.js + TypeScript", icon: <Server className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "BullMQ + Redis", icon: <Zap className="w-4 h-4" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "PostgreSQL + Prisma", icon: <Database className="w-4 h-4" />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Next.js 14 + Tailwind", icon: <Monitor className="w-4 h-4" />, color: "bg-sky-50 text-sky-700 border-sky-200" },
  { label: "Google OAuth + JWT", icon: <Shield className="w-4 h-4" />, color: "bg-red-50 text-red-700 border-red-200" },
  { label: "Nodemailer + Ethereal", icon: <Mail className="w-4 h-4" />, color: "bg-orange-50 text-orange-700 border-orange-200" },
];

const features = [
  { icon: <Zap className="w-5 h-5" />, title: "BullMQ Delayed Jobs", desc: "No cron — pure Redis-backed scheduling" },
  { icon: <RefreshCcw className="w-5 h-5" />, title: "Crash Recovery", desc: "Jobs survive server restarts" },
  { icon: <Shield className="w-5 h-5" />, title: "Idempotent Sends", desc: "Unique job IDs + DB status checks" },
  { icon: <Clock className="w-5 h-5" />, title: "Rate Limiting", desc: "Redis Lua atomic per-sender limits" },
  { icon: <SendHorizonal className="w-5 h-5" />, title: "Ethereal SMTP", desc: "Preview URLs for every sent email" },
  { icon: <Upload className="w-5 h-5" />, title: "CSV Bulk Upload", desc: "Parse, validate, schedule in one flow" },
];

const endpoints = [
  { method: "GET", path: "/auth/google", desc: "Initiate OAuth" },
  { method: "GET", path: "/auth/me", desc: "Current user" },
  { method: "POST", path: "/emails/schedule", desc: "Schedule batch" },
  { method: "POST", path: "/emails/parse-csv", desc: "Parse CSV" },
  { method: "GET", path: "/emails/scheduled", desc: "Scheduled list" },
  { method: "GET", path: "/emails/sent", desc: "Sent list" },
  { method: "GET", path: "/health", desc: "Queue stats" },
];

const methodColor: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-emerald-100 text-emerald-700",
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">ReachInbox Email Scheduler</h1>
            <p className="text-xs text-gray-500">Full-stack Hiring Assignment</p>
          </div>
          <div className="ml-auto flex gap-2">
            <a
              href="http://localhost:3000"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="http://localhost:5000/admin/queues"
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bull Board
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-medium mb-5">
              <Zap className="w-3.5 h-3.5" /> Production-Grade Implementation
            </div>
            <h2 className="text-4xl font-bold mb-3 leading-tight">
              Email Job Scheduler<br />Built for Scale
            </h2>
            <p className="text-blue-200/80 text-lg leading-relaxed mb-8">
              BullMQ queue scheduling, Redis-backed rate limiting, Google OAuth, CSV bulk upload, and a premium Next.js dashboard with dark mode.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {stack.map((s) => (
                <span key={s.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${s.color}`}>
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Features */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Key Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 text-blue-600">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API + Quick Start */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-blue-600" />
                API Endpoints
              </h3>
              <div className="space-y-1.5">
                {endpoints.map((e) => (
                  <div key={e.path} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${methodColor[e.method]}`}>{e.method}</span>
                    <code className="text-xs font-mono text-gray-800 flex-1">{e.path}</code>
                    <span className="text-xs text-gray-500">{e.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 text-base mb-3">Quick Start</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Copy <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs">apps/backend/.env.example</code> to <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs">.env</code></li>
                <li>Add Google OAuth credentials</li>
                <li>Run <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs">docker-compose up --build</code></li>
                <li>Open <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs">localhost:3000</code></li>
              </ol>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-5">Architecture</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Persistence", desc: "BullMQ stores delayed jobs in Redis sorted sets. On restart, the worker reconnects and picks up all pending jobs. No emails are lost or duplicated.", icon: <Database className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
              { title: "Rate Limiting", desc: "Atomic Lua script checks and increments per-sender and global Redis counters. When a limit is hit, the job is re-queued to the next hour — never dropped.", icon: <Shield className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50" },
              { title: "Idempotency", desc: "Each email job gets a deterministic BullMQ job ID. Duplicate enqueue calls are silently ignored. The worker also checks DB status before sending.", icon: <CheckCircle className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
            ].map((item) => (
              <div key={item.title} className={`p-5 rounded-xl ${item.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  {item.icon}
                  <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
