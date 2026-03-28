import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { UISession, UIEvent, UIClassification } from "@/lib/presenter";

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => apiFetch<{ sessions: UISession[] }>("/api/sessions"),
    select: (data) => data.sessions,
    refetchInterval: 10_000,
    staleTime: 9_000,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () =>
      apiFetch<{ session: UISession; events: UIEvent[]; classifications: UIClassification[] }>(
        `/api/sessions/${id}`
      ),
    enabled: !!id,
    // Poll every 5s while running, stop once terminal
    refetchInterval: (query) => {
      const status = query.state.data?.session?.status;
      return status === "running" ? 5_000 : false;
    },
    staleTime: 4_000,
  });
}
