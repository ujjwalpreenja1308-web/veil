"use client";

import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  running: { label: "Running", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  completed: { label: "Healthy", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  failed: { label: "Failing", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

interface AgentStatusBadgeProps {
  lastSessionStatus: string | null;
}

export function AgentStatusBadge({ lastSessionStatus }: AgentStatusBadgeProps) {
  const config = statusConfig[lastSessionStatus ?? ""] ?? {
    label: "No data",
    className: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
