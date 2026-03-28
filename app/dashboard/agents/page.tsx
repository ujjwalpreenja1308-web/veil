"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthIndicator } from "@/components/veil/HealthIndicator";
import { AgentStatusBadge } from "@/components/veil/AgentStatusBadge";
import { Bot } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import type { HealthStatus } from "@/components/veil/HealthIndicator";

const healthFromStatus = (status: string | null): HealthStatus => {
  if (status === "failed") return "critical";
  if (status === "running") return "warning";
  if (status === "completed") return "healthy";
  return "unknown";
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground mt-1">All monitored agents in your organization.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !agents?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No agents yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Add{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                veil.init()
              </code>{" "}
              to your agent to start monitoring.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <HealthIndicator status={healthFromStatus(agent.last_session_status)} />
                  <span className="font-medium">{agent.name}</span>
                  <div className="ml-auto flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {agent.session_count} sessions · {agent.failure_count} failures
                    </span>
                    <AgentStatusBadge lastSessionStatus={agent.last_session_status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
