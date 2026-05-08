"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: (failureCount, error: unknown) => {
              const status = (error as { response?: { status: number } })?.response?.status;
              if (status === 401 || status === 403) return false;
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
