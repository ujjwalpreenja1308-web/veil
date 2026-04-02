"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCard } from "@/components/veil/AlertCard";
import { Bell, X, Loader2 } from "lucide-react";
import { useClassifications } from "@/hooks/use-classifications";
import { FAILURE_CATEGORIES } from "@/lib/rules/categories";
import type { FailureCategory } from "@/lib/rules/categories";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;
type SeverityFilter = (typeof SEVERITIES)[number];

function AlertsContent() {
  const { data: classifications, isLoading, isFetching, hasMore, loadMore } = useClassifications();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<SeverityFilter>("all");

  const categoryFilter = searchParams.get("category");

  function clearFilters() {
    router.replace("/dashboard/alerts");
  }

  const filtered = classifications?.filter((c) => {
    if (filter !== "all" && c.severity !== filter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const hasActiveFilters = !!categoryFilter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-1">All detected failures across your agents.</p>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-2">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          <Badge variant="outline" className="text-xs">
            {FAILURE_CATEGORIES[categoryFilter as FailureCategory] ?? categoryFilter}
          </Badge>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto gap-1" onClick={clearFilters}>
            <X className="h-3 w-3" /> Clear
          </Button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {SEVERITIES.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
            className="capitalize"
          >
            {s}
            {s !== "all" && classifications && (
              <span className="ml-1.5 text-xs opacity-70">
                {classifications.filter(
                  (c) => c.severity === s && (!categoryFilter || c.category === categoryFilter)
                ).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No alerts</h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No alerts match the current filters."
                : filter === "all"
                ? "Failure classifications will appear here when your agents encounter issues."
                : `No ${filter} severity alerts found.`}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <AlertCard key={c.id} classification={c} />
          ))}
          {hasMore && !categoryFilter && filter === "all" && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={isFetching}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}>
      <AlertsContent />
    </Suspense>
  );
}
