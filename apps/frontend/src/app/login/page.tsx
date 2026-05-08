"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { authApi } from "@/services/api";
import { Mail, ArrowRight, Zap, Shield, Clock, RefreshCcw } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const features = [
  { icon: <Zap className="w-5 h-5" />, title: "BullMQ-Powered", desc: "Reliable job scheduling with Redis persistence" },
  { icon: <RefreshCcw className="w-5 h-5" />, title: "Crash Recovery", desc: "Jobs survive server restarts — no emails lost" },
  { icon: <Shield className="w-5 h-5" />, title: "Rate Limiting", desc: "Redis-backed per-sender hourly limits" },
  { icon: <Clock className="w-5 h-5" />, title: "Idempotent Sends", desc: "Duplicate detection prevents double sends" },
];

export default function LoginPage() {
  const router = useRouter();
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getMe,
    retry: false,
  });

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">ReachInbox</h1>
                <p className="text-blue-300 text-sm">Email Scheduler</p>
              </div>
            </div>

            <h2 className="text-5xl font-bold leading-[1.1] mb-5">
              Schedule emails<br />at scale, reliably.
            </h2>
            <p className="text-blue-200/80 text-lg leading-relaxed mb-12 max-w-md">
              A production-grade email scheduling platform built with BullMQ, Redis, and PostgreSQL.
            </p>

            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm"
                >
                  <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 text-blue-400">
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{f.title}</p>
                    <p className="text-xs text-blue-300/70">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — login card */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ReachInbox</span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold tracking-tight">Welcome back</h3>
            <p className="text-muted-foreground text-sm mt-1.5">Sign in to access your email dashboard</p>
          </div>

          <a
            href={`${apiUrl}/auth/google`}
            className="group flex items-center justify-center gap-3 w-full h-12 px-4 rounded-xl border-2 border-border bg-background text-foreground font-medium hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </a>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Secured by OAuth 2.0</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
