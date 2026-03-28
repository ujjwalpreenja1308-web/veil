"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CostTrend } from "@/components/veil/CostTrend";
import { useCostByDay, useOverviewStats } from "@/hooks/use-stats";

export default function CostPage() {
  const { data: costData, isLoading: costLoading } = useCostByDay(30);
  const { data: stats, isLoading: statsLoading } = useOverviewStats();

  const totalCostAllTime = costData?.reduce((sum, d) => sum + d.cost, 0) ?? 0;
  const totalSessions = costData?.reduce((sum, d) => sum + d.sessions, 0) ?? 0;
  const avgCostPerSession = totalSessions > 0 ? totalCostAllTime / totalSessions : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cost Analytics</h1>
        <p className="text-muted-foreground mt-1">30-day spending breakdown across your agents.</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Cost Today",
            value: statsLoading ? null : `$${(stats?.costToday ?? 0).toFixed(4)}`,
          },
          {
            label: "30-Day Total",
            value: costLoading ? null : `$${totalCostAllTime.toFixed(4)}`,
          },
          {
            label: "Avg per Session",
            value: costLoading ? null : `$${avgCostPerSession.toFixed(4)}`,
          },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {value !== null ? (
                <p className="text-2xl font-bold">{value}</p>
              ) : (
                <Skeleton className="h-8 w-24" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Spend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {costLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <CostTrend data={costData ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
