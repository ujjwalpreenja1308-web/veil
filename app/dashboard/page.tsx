"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthIndicator } from "@/components/veil/HealthIndicator";
import { Bot, ScrollText, AlertTriangle, DollarSign } from "lucide-react";

const statCards = [
  {
    title: "Total Agents",
    icon: Bot,
    value: null as string | null,
  },
  {
    title: "Sessions Today",
    icon: ScrollText,
    value: null as string | null,
  },
  {
    title: "Failures Today",
    icon: AlertTriangle,
    value: null as string | null,
  },
  {
    title: "Cost Today",
    icon: DollarSign,
    value: null as string | null,
  },
];

export default function DashboardPage() {
  // TODO: Replace with real data fetching
  const agents: { id: string; name: string; status: "healthy" | "warning" | "critical" | "unknown" }[] = [];
  const isLoading = false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Health of all your AI agents at a glance.
        </p>
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
              {stat.value !== null ? (
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
        ) : agents.length === 0 ? (
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
              <Card key={agent.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <HealthIndicator status={agent.status} />
                  <span className="font-medium">{agent.name}</span>
                  <span className="ml-auto text-sm text-muted-foreground capitalize">
                    {agent.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
