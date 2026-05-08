"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledTable } from "@/components/email/scheduled-table";
import { SentTable } from "@/components/email/sent-table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, SendHorizonal } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useWebSocket();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, {user?.name?.split(" ")[0]}
          </p>
        </motion.div>

        {/* Stats */}
        <StatsCards />

        {/* Tabs */}
        <Tabs defaultValue="scheduled" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduled" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <SendHorizonal className="h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>
          <TabsContent value="scheduled">
            <ScheduledTable />
          </TabsContent>
          <TabsContent value="sent">
            <SentTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
