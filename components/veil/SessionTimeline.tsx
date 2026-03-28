"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UIEvent } from "@/lib/presenter";
import { format } from "date-fns";

const typeColors: Record<string, string> = {
  "LLM Call": "bg-purple-500",
  "OpenAI Call": "bg-purple-500",
  "Anthropic Call": "bg-violet-500",
  "Tool Call": "bg-blue-500",
  "Tool Result": "bg-blue-400",
  "Retrieval": "bg-green-500",
  "Embedding": "bg-teal-500",
  "Session End": "bg-slate-500",
};

interface SessionTimelineProps {
  events: UIEvent[];
}

export function SessionTimeline({ events }: SessionTimelineProps) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No events recorded.</p>;
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

      {events.map((event, i) => {
        const hasError = !!event.error;
        const dotColor = hasError
          ? "bg-red-500"
          : typeColors[event.type] ?? "bg-muted-foreground";

        return (
          <div key={event.id ?? i} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="relative z-10 flex h-[31px] w-[31px] shrink-0 items-center justify-center">
              <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
            </div>

            <Card className="flex-1">
              <CardContent className="py-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-mono">
                    Step {event.step}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {event.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(event.timestamp), "HH:mm:ss.SSS")}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  {event.provider && <p>Provider: {event.provider}</p>}
                  {event.model && <p>Model: {event.model}</p>}
                  {event.durationMs != null && <p>Duration: {event.durationMs}ms</p>}
                  {event.cost != null && <p>Cost: ${event.cost.toFixed(4)}</p>}
                  {event.promptTokens != null && (
                    <p>Tokens: {event.promptTokens} in / {event.completionTokens ?? 0} out</p>
                  )}
                  {hasError && (
                    <p className="text-red-500">Error: {event.error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
