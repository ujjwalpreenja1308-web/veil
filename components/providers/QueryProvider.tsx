"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              // Don't retry 401/403/404 — those are not transient
              if (error instanceof Error) {
                const status = parseInt(error.message.match(/API error (\d+)/)?.[1] ?? "0", 10);
                if ([401, 403, 404].includes(status)) return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            onError: (error) => {
              const msg = error instanceof Error ? error.message : "Something went wrong";
              toast.error(msg);
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only show toast on background refetch failures (not initial load)
            // so we don't spam on first mount
            if (query.state.data !== undefined) {
              const msg = error instanceof Error ? error.message : "Failed to refresh data";
              toast.error(`Data refresh failed: ${msg}`, { id: String(query.queryKey[0]) });
            }
          },
        }),
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
