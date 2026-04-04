"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UISession, UIEvent, UIClassification } from "@/lib/presenter";

const PAGE_SIZE = 50;

export function useSessions() {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ["sessions", limit],
    queryFn: () =>
      apiFetch<{ sessions: UISession[]; hasMore: boolean }>(`/api/sessions?limit=${limit}`),
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  function loadMore() {
    setLimit((prev) => prev + PAGE_SIZE);
  }

  return {
    ...query,
    data: query.data?.sessions,
    hasMore: query.data?.hasMore ?? false,
    loadMore,
  };
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () =>
      apiFetch<{ session: UISession; events: UIEvent[]; classifications: UIClassification[] }>(
        `/api/sessions/${id}`
      ),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.session?.status;
      return status === "running" ? 5_000 : false;
    },
    // Don't re-hit the server on tab focus for terminal sessions — they won't change
    refetchOnWindowFocus: (query) => {
      const status = query.state.data?.session?.status;
      return status === "running" || status === undefined;
    },
    staleTime: 10_000,
  });
}

export function usePrefetchSession() {
  const queryClient = useQueryClient();
  return (id: string) => {
    void queryClient.prefetchQuery({
      queryKey: ["session", id],
      queryFn: () =>
        apiFetch<{ session: UISession; events: UIEvent[]; classifications: UIClassification[] }>(
          `/api/sessions/${id}`
        ),
      staleTime: 10_000,
    });
  };
}
