import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { InspectorRun } from "@/lib/db/schema";

// ─── useInspectorRuns ────────────────────────────────────────────────────────

export function useInspectorRuns(agentId?: string) {
  const queryClient = useQueryClient();
  const url = agentId
    ? `/api/inspector/runs?agent_id=${agentId}`
    : "/api/inspector/runs";

  // Subscribe to any change on inspector_runs for this agent — invalidates the list
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const filter = agentId ? `agent_id=eq.${agentId}` : undefined;

    const sub = supabase
      .channel(`inspector-runs:${agentId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inspector_runs",
          ...(filter ? { filter } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inspector-runs", agentId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [agentId, queryClient]);

  return useQuery<{ runs: InspectorRun[] }>({
    queryKey: ["inspector-runs", agentId],
    queryFn: () => fetch(url).then((r) => r.json()),
    staleTime: 10_000,
  });
}

// ─── useInspectorRun ─────────────────────────────────────────────────────────

export function useInspectorRun(runId: string | null) {
  const queryClient = useQueryClient();

  // Subscribe to changes on this specific run row — fires when FastAPI updates status
  useEffect(() => {
    if (!runId) return;

    const supabase = getSupabaseBrowser();

    const sub = supabase
      .channel(`inspector-run:${runId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "inspector_runs",
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          // Optimistically update the cache with the new row data
          queryClient.setQueryData(["inspector-run", runId], { run: payload.new });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [runId, queryClient]);

  return useQuery<{ run: InspectorRun }>({
    queryKey: ["inspector-run", runId],
    queryFn: () => fetch(`/api/inspector/runs/${runId}`).then((r) => r.json()),
    enabled: !!runId,
    staleTime: 30_000,
  });
}

// ─── useRunInspector ─────────────────────────────────────────────────────────

export function useRunInspector() {
  const queryClient = useQueryClient();

  return useMutation<{ run: InspectorRun }, Error, { agent_id: string }>({
    mutationFn: ({ agent_id }) =>
      fetch("/api/inspector/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id }),
      }).then((r) => r.json()),
    onSuccess: (_, { agent_id }) => {
      queryClient.invalidateQueries({ queryKey: ["inspector-runs", agent_id] });
      queryClient.invalidateQueries({ queryKey: ["inspector-runs", undefined] });
    },
  });
}
