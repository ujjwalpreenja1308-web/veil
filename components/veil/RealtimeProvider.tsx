"use client";

import { useRealtimeDashboard } from "@/hooks/use-realtime";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// Thin client component that activates Realtime subscriptions once org is known.
// Renders nothing — side-effect only.
export function RealtimeProvider() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ provisioned: boolean; org_id?: string }>("/api/me"),
    staleTime: Infinity,
  });

  useRealtimeDashboard((data as { org_id?: string } | undefined)?.org_id);

  return null;
}
