"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FailureTypeTag } from "@/components/veil/FailureTypeTag";
import { ScrollText } from "lucide-react";
import { useSessions } from "@/hooks/use-sessions";
import { formatDistanceToNow } from "date-fns";

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  running: { label: "Running", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground mt-1">All agent sessions across your organization.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !sessions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ScrollText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
            <p className="text-sm text-muted-foreground">
              Sessions appear here once your agents send telemetry.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const sb = statusBadge[session.status] ?? statusBadge.running;
            return (
              <Link key={session.id} href={`/dashboard/sessions/${session.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <code className="text-xs text-muted-foreground font-mono">
                      {session.id.slice(0, 8)}
                    </code>
                    <Badge variant={sb.variant}>{sb.label}</Badge>
                    {session.failureType && (
                      <FailureTypeTag category={session.failureType} />
                    )}
                    <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                      <span>${session.cost.toFixed(4)}</span>
                      <span>{session.durationMs}ms</span>
                      <span>
                        {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
