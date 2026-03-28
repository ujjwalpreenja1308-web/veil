"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthIndicator } from "@/components/veil/HealthIndicator";
import { AgentStatusBadge } from "@/components/veil/AgentStatusBadge";
import { Bot, ScrollText, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useOverviewStats } from "@/hooks/use-stats";
import { useAgents } from "@/hooks/use-agents";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LiveBadge } from "@/components/veil/LiveBadge";
import type { HealthStatus } from "@/components/veil/HealthIndicator";

const healthFromStatus = (status: string | null): HealthStatus => {
  if (status === "failed") return "critical";
  if (status === "running") return "warning";
  if (status === "completed") return "healthy";
  return "unknown";
};

function useProvisioningStatus() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ provisioned: boolean }>("/api/me"),
    staleTime: 0,
    refetchInterval: (query) => {
      return query.state.data?.provisioned ? false : 2000;
    },
  });
}

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useProvisioningStatus();
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useOverviewStats();
  const { data: agents, isLoading: agentsLoading, isFetching: agentsFetching } = useAgents();

  // Show provisioning screen until org is ready
  if (meLoading || !me?.provisioned) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <h2 className="text-lg font-semibold">Setting up your account…</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We&apos;re provisioning your organization. This takes just a moment.
        </p>
      </div>
    );
  }

  const statCards = [
    { title: "Total Agents", icon: Bot, value: stats?.totalAgents?.toString() ?? null },
    { title: "Sessions Today", icon: ScrollText, value: stats?.sessionsToday?.toString() ?? null },
    { title: "Failures Today", icon: AlertTriangle, value: stats?.failuresToday?.toString() ?? null },
    { title: "Cost Today", icon: DollarSign, value: stats ? `$${stats.costToday.toFixed(4)}` : null },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Health of all your AI agents at a glance.</p>
        </div>
        <LiveBadge isFetching={statsFetching || agentsFetching} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.value !== null && !statsLoading ? (
                <div className="text-2xl font-bold">{stat.value}</div>
              ) : (
                <Skeleton className="h-8 w-20" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Agents</h2>
        {agentsLoading ? (
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
                to your agent and it will appear here automatically.
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
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {agent.session_count} sessions
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
    </div>
  );
}
