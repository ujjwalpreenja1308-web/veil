"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthIndicator } from "@/components/veil/HealthIndicator";
import { AgentStatusBadge } from "@/components/veil/AgentStatusBadge";
import { Bot, ScrollText, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useOverviewStats } from "@/hooks/use-stats";
import { useAgents, usePrefetchAgent } from "@/hooks/use-agents";
import { usePatterns } from "@/hooks/use-patterns";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { LiveBadge } from "@/components/veil/LiveBadge";
import { PatternCard } from "@/components/veil/PatternCard";
import { OnboardingBanner } from "@/components/veil/OnboardingBanner";
import { useSlackConnection } from "@/hooks/use-slack-connection";
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
    // Once provisioned, cache forever — never re-check on navigation
    staleTime: (query) => query.state.data?.provisioned ? Infinity : 0,
    refetchInterval: (query) => query.state.data?.provisioned ? false : 2000,
  });
}

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useProvisioningStatus();
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useOverviewStats();
  const { data: agents, isLoading: agentsLoading, isFetching: agentsFetching } = useAgents();
  const { data: patterns } = usePatterns(7);
  const { data: slackData } = useSlackConnection();
  const prefetchAgent = usePrefetchAgent();

  // Show provisioning screen only on first load (no cached data yet)
  if (meLoading && !me) {
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

      {/* Onboarding */}
      <OnboardingBanner
        hasAgents={!!agents?.length}
        hasSessions={!!stats?.sessionsToday || false}
        slackConnected={slackData?.connected ?? false}
      />

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

      {/* Failure Patterns — only shown when patterns exist */}
      {patterns && patterns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Failure Patterns</h2>
          {patterns.slice(0, 3).map((p) => (
            <PatternCard key={`${p.agentId}-${p.category}`} pattern={p} windowDays={7} />
          ))}
          {patterns.length > 3 && (
            <p className="text-sm text-muted-foreground text-center">
              <a href="/dashboard/patterns" className="underline underline-offset-4">
                View all {patterns.length} patterns →
              </a>
            </p>
          )}
        </div>
      )}

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
              <Link key={agent.id} href={`/dashboard/agents/${agent.id}`} className="block">
                <Card
                  tabIndex={-1}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onMouseEnter={() => prefetchAgent(agent.id)}
                >
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
