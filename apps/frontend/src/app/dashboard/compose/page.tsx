"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ComposeForm } from "@/components/email/compose-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function ComposePage() {
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
      <ComposeForm />
    </DashboardShell>
  );
}
