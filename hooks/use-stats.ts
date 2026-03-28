import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CostByDay, OverviewStats } from "@/lib/db/queries";

interface StatsResponse extends OverviewStats {
  costByDay: CostByDay[];
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<StatsResponse>("/api/stats"),
    refetchInterval: 10_000,
    staleTime: 9_000,
  });
}

export function useCostByDay(days = 30) {
  return useQuery({
    queryKey: ["stats", "cost", days],
    queryFn: () => apiFetch<StatsResponse>(`/api/stats?days=${days}`),
    select: (data) => data.costByDay,
    refetchInterval: 30_000,
    staleTime: 29_000,
  });
}
