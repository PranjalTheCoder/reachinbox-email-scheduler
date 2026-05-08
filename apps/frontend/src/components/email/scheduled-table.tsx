"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { emailApi } from "@/services/api";
import { StatusBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { CalendarClock, Inbox } from "lucide-react";

export function ScheduledTable() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["emails", "scheduled", page],
    queryFn: () => emailApi.getScheduled(page),
    placeholderData: (prev) => prev,
    refetchInterval: 15000,
  });

  if (error) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center">
        <p className="text-destructive">Failed to load scheduled emails.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Scheduled Emails</h3>
        {data && (
          <span className="ml-auto text-sm text-muted-foreground">{data.total} total</span>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No scheduled emails</p>
          <p className="text-sm mt-1">Compose a new email to get started</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {data.items.map((job, i) => (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-sm font-medium">{job.recipientEmail}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground max-w-xs truncate">{job.subject}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        <span title={formatDate(job.scheduledTime)}>{formatRelativeTime(job.scheduledTime)}</span>
                        <p className="text-xs text-muted-foreground/60">{formatDate(job.scheduledTime)}</p>
                      </td>
                      <td className="px-6 py-3.5"><StatusBadge status={job.status} /></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
