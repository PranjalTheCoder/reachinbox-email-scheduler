"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SentTable } from "@/components/email/sent-table";
import { Skeleton } from "@/components/ui/skeleton";
import { SendHorizonal } from "lucide-react";

export default function SentPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SendHorizonal className="h-6 w-6 text-emerald-500" />
            Sent Emails
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Emails that have been processed</p>
        </div>
        <SentTable />
      </div>
    </DashboardShell>
  );
}
