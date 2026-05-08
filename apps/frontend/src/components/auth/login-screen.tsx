import { ArrowRight, Clock, Mail, RefreshCcw, Shield, Zap } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const features = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "BullMQ-Powered",
    desc: "Reliable job scheduling with Redis persistence",
  },
  {
    icon: <RefreshCcw className="h-5 w-5" />,
    title: "Crash Recovery",
    desc: "Jobs survive server restarts without losing queued emails",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Rate Limiting",
    desc: "Redis-backed per-sender hourly limits",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Idempotent Sends",
    desc: "Duplicate detection prevents double sends",
  },
];

export function LoginScreen() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ReachInbox</h1>
              <p className="text-sm text-blue-300">Email Scheduler</p>
            </div>
          </div>

          <h2 className="mb-5 text-5xl font-bold leading-[1.1]">
            Schedule emails
            <br />
            at scale, reliably.
          </h2>
          <p className="mb-12 max-w-md text-lg leading-relaxed text-blue-200/80">
            A production-grade email scheduling platform built with BullMQ, Redis,
            and PostgreSQL.
          </p>

          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.06] p-3.5 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{feature.title}</p>
                  <p className="text-xs text-blue-300/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ReachInbox</span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold tracking-tight">Welcome back</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to access your email dashboard
            </p>
          </div>

          <a
            href={`${apiUrl}/auth/google`}
            className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-background px-4 font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </a>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Secured by OAuth 2.0</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
