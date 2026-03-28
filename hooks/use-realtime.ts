"use client";

// Supabase Realtime hook — invalidates React Query caches when DB rows change.
// Usage: call once near the top of the dashboard layout.
// This gives near-real-time updates without polling.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function useRealtimeDashboard(orgId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const supabase = getSupabaseBrowser();

    // Sessions: new sessions or status changes
    const sessionsSub = supabase
      .channel(`sessions:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
          queryClient.invalidateQueries({ queryKey: ["agents"] });
        }
      )
      .subscribe();

    // Classifications: new failures detected
    const classificationsSub = supabase
      .channel(`classifications:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "classifications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["classifications"] });
          queryClient.invalidateQueries({ queryKey: ["patterns"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsSub);
      supabase.removeChannel(classificationsSub);
    };
  }, [orgId, queryClient]);
}
