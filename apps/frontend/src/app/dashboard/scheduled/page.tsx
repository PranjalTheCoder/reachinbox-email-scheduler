"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ScheduledTable } from "@/components/email/scheduled-table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock } from "lucide-react";

export default function ScheduledPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-background p-6"><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Scheduled Emails
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Emails waiting to be sent</p>
        </div>
        <ScheduledTable />
      </div>
    </DashboardShell>
  );
}
