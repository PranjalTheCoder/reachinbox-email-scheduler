"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { emailApi } from "@/services/api";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Clock, Activity, CheckCircle, XCircle } from "lucide-react";

const cards = [
  { key: "delayed", label: "Delayed", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "active", label: "Active", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "completed", label: "Completed", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "failed", label: "Failed", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
] as const;

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: emailApi.getHealth,
    refetchInterval: 10000,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow"
        >
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {data?.queue[card.key] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
