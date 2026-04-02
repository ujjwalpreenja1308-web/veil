"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Fix } from "@/lib/db/schema";

export interface FixWithImpact extends Fix {
  impact: {
    beforeCount: number;
    afterCount: number;
    beforeDays: number;
    afterDays: number;
    deltaPercent: number | null;
  } | null;
}

export function useFixes() {
  return useQuery({
    queryKey: ["fixes"],
    queryFn: () => apiFetch<{ fixes: FixWithImpact[] }>("/api/fixes"),
    select: (data) => data.fixes,
    staleTime: 30_000,
  });
}

export function useCreateFix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      category: string;
      description: string;
      agent_id?: string;
      applied_at?: string;
    }) =>
      apiFetch<{ fix: Fix }>("/api/fixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixes"] });
      queryClient.invalidateQueries({ queryKey: ["patterns"] });
    },
  });
}

export function useDeleteFix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fixId: string) =>
      apiFetch(`/api/fixes/${fixId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixes"] });
    },
  });
}
