import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < -60) return formatDate(dateStr);
  if (diffMins < 0) return `${Math.abs(diffMins)}m ago`;
  if (diffMins === 0) return "now";
  if (diffMins < 60) return `in ${diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `in ${diffHours}h`;
  return formatDate(dateStr);
}
