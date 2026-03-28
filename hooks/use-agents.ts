import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Agent } from "@/lib/db/schema";
import type { AgentWithHealth } from "@/lib/db/queries";
import type { UISession } from "@/lib/presenter";

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => apiFetch<{ agents: AgentWithHealth[] }>("/api/agents"),
    select: (data) => data.agents,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agent", id],
    queryFn: () => apiFetch<{ agent: Agent; sessions: UISession[] }>(`/api/agents/${id}`),
    enabled: !!id,
    refetchInterval: 10_000,
    staleTime: 10_000,
  });
}

export function usePrefetchAgent() {
  const queryClient = useQueryClient();
  return (id: string) => {
    void queryClient.prefetchQuery({
      queryKey: ["agent", id],
      queryFn: () => apiFetch<{ agent: Agent; sessions: UISession[] }>(`/api/agents/${id}`),
      staleTime: 10_000,
    });
  };
}
