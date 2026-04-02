"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UIClassification } from "@/lib/presenter";

export interface UIClassificationWithSession extends UIClassification {
  session?: { id: string; startedAt: string };
}

const PAGE_SIZE = 100;

export function useClassifications() {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ["classifications", limit],
    queryFn: () =>
      apiFetch<{ classifications: UIClassificationWithSession[]; hasMore: boolean }>(
        `/api/classifications?limit=${limit}`
      ),
    staleTime: 10_000,
  });

  function loadMore() {
    setLimit((prev) => prev + PAGE_SIZE);
  }

  return {
    ...query,
    data: query.data?.classifications,
    hasMore: query.data?.hasMore ?? false,
    loadMore,
  };
}

export function useUpdateClassification(sessionId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classificationId,
      updates,
    }: {
      classificationId: string;
      updates: { notes?: string | null; suggestion_applied?: boolean };
    }) =>
      apiFetch(`/api/classifications/${classificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classifications"] });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      }
    },
  });
}
