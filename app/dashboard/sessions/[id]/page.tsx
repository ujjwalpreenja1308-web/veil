"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionTimeline } from "@/components/veil/SessionTimeline";
import { AlertCard } from "@/components/veil/AlertCard";
import { SuggestionCard } from "@/components/veil/SuggestionCard";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { use } from "react";
import { useSession } from "@/hooks/use-sessions";
import { formatDistanceToNow, format } from "date-fns";

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  running: "secondary",
  completed: "default",
  failed: "destructive",
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSession(id);
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/sessions" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Sessions
        </Link>
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const { session, events, classifications } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/sessions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          {session.agentName && (
            <p className="text-sm text-muted-foreground">{session.agentName}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight font-mono">{session.id.slice(0, 8)}…</h1>
        </div>
        <Badge variant={statusVariant[session.status] ?? "secondary"}>{session.status}</Badge>
        {session.failureLabel && (
          <Badge variant="destructive" className="text-xs">{session.failureLabel}</Badge>
        )}
      </div>

      {/* Session Meta */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cost", value: `$${session.cost.toFixed(4)}` },
          { label: "Duration", value: `${session.durationMs}ms` },
          { label: "Started", value: formatDistanceToNow(new Date(session.startedAt), { addSuffix: true }) },
          {
            label: "Completed",
            value: session.completedAt
              ? format(new Date(session.completedAt), "HH:mm:ss")
              : "—",
          },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classifications + Suggestions */}
      {classifications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Failures Detected</h2>
          {classifications.map((c) => (
            <div key={c.id} className="space-y-2">
              <AlertCard
                classification={{
                  ...c,
                  session: { id: session.id, startedAt: session.startedAt },
                }}
              />
              <SuggestionCard classification={c} sessionId={session.id} />
            </div>
          ))}
        </div>
      )}

      {/* Inspector */}
      {session.agentId && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Inspector</h2>
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Deep Agent Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    Run Inspector on this agent to find root causes, patterns, and fixes across all sessions.
                  </p>
                </div>
              </div>
              <Link href={`/dashboard/inspectors?agent_id=${session.agentId}`}>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <FlaskConical className="h-3.5 w-3.5" />
                  View Inspector
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Event Timeline</h2>
        <SessionTimeline events={events} />
      </div>
    </div>
  );
}
