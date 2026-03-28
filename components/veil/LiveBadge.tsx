"use client";

interface LiveBadgeProps {
  isFetching: boolean;
}

export function LiveBadge({ isFetching }: LiveBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${isFetching ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"}`} />
      {isFetching ? "Live" : "Paused"}
    </span>
  );
}
