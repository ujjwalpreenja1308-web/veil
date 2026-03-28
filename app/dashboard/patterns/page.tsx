"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PatternCard } from "@/components/veil/PatternCard";
import { TrendingUp } from "lucide-react";
import { usePatterns } from "@/hooks/use-patterns";

const WINDOW_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

export default function PatternsPage() {
  const [days, setDays] = useState(7);
  const { data: patterns, isLoading } = usePatterns(days);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Failure Patterns</h1>
          <p className="text-muted-foreground mt-1">
            Recurring failures detected across your agents. Patterns appear after 5+ failures of the same type.
          </p>
        </div>
        <div className="flex gap-2">
          {WINDOW_OPTIONS.map((o) => (
            <Button
              key={o.value}
              size="sm"
              variant={days === o.value ? "default" : "outline"}
              onClick={() => setDays(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !patterns?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No patterns detected</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Patterns appear when an agent fails 5 or more times with the same failure type
              in the selected time window.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patterns.map((p) => (
            <PatternCard key={`${p.agentId}-${p.category}`} pattern={p} windowDays={days} />
          ))}
        </div>
      )}
    </div>
  );
}
