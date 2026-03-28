"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface UIPattern {
  agentId: string;
  agentName: string;
  category: string;
  categoryLabel: string;
  count: number;
  subcategories: { subcategory: string; count: number }[];
  firstSeen: string;
  lastSeen: string;
  severity: "low" | "medium" | "high" | "critical";
}

export function usePatterns(days = 7) {
  return useQuery({
    queryKey: ["patterns", days],
    queryFn: () =>
      apiFetch<{ patterns: UIPattern[] }>(`/api/patterns?days=${days}`),
    select: (data) => data.patterns,
    staleTime: 60_000,
  });
}
