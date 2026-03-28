"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentStatusBadge } from "@/components/veil/AgentStatusBadge";
import { FailureTypeTag } from "@/components/veil/FailureTypeTag";
import { ArrowLeft, Bot } from "lucide-react";
import { useAgent } from "@/hooks/use-agents";
import { formatDistanceToNow } from "date-fns";

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useAgent(params.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Overview
        </Link>
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  const { agent, sessions } = data;
  const failureCount = sessions.filter((s) => s.status === "failed").length;
  const lastSession = sessions[0];
  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);
  const failureRate = sessions.length > 0 ? ((failureCount / sessions.length) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Bot className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
        <AgentStatusBadge lastSessionStatus={lastSession?.status ?? null} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Sessions", value: sessions.length.toString() },
          { label: "Failure Rate", value: `${failureRate}%` },
          { label: "Total Cost", value: `$${totalCost.toFixed(4)}` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Sessions</h2>
        {!sessions.length ? (
          <p className="text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link key={session.id} href={`/dashboard/sessions/${session.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <code className="text-xs text-muted-foreground font-mono">{session.id.slice(0, 8)}</code>
                    <Badge variant={session.status === "failed" ? "destructive" : session.status === "running" ? "secondary" : "default"}>
                      {session.status}
                    </Badge>
                    {session.failureType && <FailureTypeTag category={session.failureType} />}
                    <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                      <span>${session.cost.toFixed(4)}</span>
                      <span>{session.durationMs}ms</span>
                      <span>{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
