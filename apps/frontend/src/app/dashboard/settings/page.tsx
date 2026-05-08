"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Palette, Mail, Shield } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account and preferences
          </p>
        </motion.div>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" /> Profile
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input defaultValue={user?.name ?? ""} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue={user?.email ?? ""} disabled />
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Palette className="h-4 w-4" /> Appearance
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Toggle between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        </motion.div>

        {/* Email Settings */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Mail className="h-4 w-4" /> Email Defaults
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Default Delay (ms)</label>
              <Input type="number" defaultValue={2000} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max Emails / Hour</label>
              <Input type="number" defaultValue={100} />
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="h-4 w-4" /> Security
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Google OAuth</p>
              <p className="text-xs text-muted-foreground">
                Connected as {user?.email}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
