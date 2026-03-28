"use client";

import { cn } from "@/lib/utils";

export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

interface HealthIndicatorProps {
  status: HealthStatus;
  label?: string;
  pulse?: boolean;
}

const statusConfig: Record<
  HealthStatus,
  { color: string; bg: string; ring: string }
> = {
  healthy: {
    color: "bg-veil-healthy",
    bg: "bg-veil-healthy/10",
    ring: "ring-veil-healthy/20",
  },
  warning: {
    color: "bg-veil-warning",
    bg: "bg-veil-warning/10",
    ring: "ring-veil-warning/20",
  },
  critical: {
    color: "bg-veil-critical",
    bg: "bg-veil-critical/10",
    ring: "ring-veil-critical/20",
  },
  unknown: {
    color: "bg-veil-unknown",
    bg: "bg-veil-unknown/10",
    ring: "ring-veil-unknown/20",
  },
};

export function HealthIndicator({ status, label, pulse }: HealthIndicatorProps) {
  const config = statusConfig[status];
  const shouldPulse = pulse ?? status === "critical";

  return (
    <div className="flex items-center gap-2">
      <span className={cn("relative flex h-3 w-3", config.bg, "rounded-full ring-1", config.ring)}>
        <span
          className={cn(
            "absolute inset-0 rounded-full",
            config.color,
            shouldPulse && "animate-ping opacity-75"
          )}
        />
        <span
          className={cn("relative inline-flex h-3 w-3 rounded-full", config.color)}
        />
      </span>
      {label && (
        <span className="text-sm text-muted-foreground capitalize">
          {label ?? status}
        </span>
      )}
    </div>
  );
}
