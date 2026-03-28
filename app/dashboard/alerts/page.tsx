"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCard } from "@/components/veil/AlertCard";
import { Bell } from "lucide-react";
import { useClassifications } from "@/hooks/use-classifications";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;
type SeverityFilter = (typeof SEVERITIES)[number];

export default function AlertsPage() {
  const { data: classifications, isLoading } = useClassifications();
  const [filter, setFilter] = useState<SeverityFilter>("all");

  const filtered = classifications?.filter(
    (c) => filter === "all" || c.severity === filter
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground mt-1">All detected failures across your agents.</p>
      </div>

      {/* Severity filter */}
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
                {classifications.filter((c) => c.severity === s).length}
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
              {filter === "all"
                ? "Failure classifications will appear here when your agents encounter issues."
                : `No ${filter} severity alerts found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <AlertCard key={c.id} classification={c} />
          ))}
        </div>
      )}
    </div>
  );
}
