"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FailureTypeTag } from "./FailureTypeTag";
import type { UIPattern } from "@/hooks/use-patterns";

const severityColor: Record<string, string> = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
};

interface PatternCardProps {
  pattern: UIPattern;
  windowDays: number;
}

export function PatternCard({ pattern, windowDays }: PatternCardProps) {
  return (
    <Card className="border-orange-500/30 bg-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className={`h-4 w-4 shrink-0 ${severityColor[pattern.severity] ?? "text-muted-foreground"}`} />
            <span className="text-sm font-semibold">Pattern Detected</span>
            <FailureTypeTag category={pattern.category} severity={pattern.severity} />
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {windowDays}d window
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{pattern.agentName}</span>
          <span className="text-sm text-muted-foreground">
            has failed{" "}
            <span className={`font-bold ${severityColor[pattern.severity]}`}>
              {pattern.count} times
            </span>{" "}
            this {windowDays === 7 ? "week" : `${windowDays} days`} with{" "}
            <span className="font-medium">{pattern.categoryLabel}</span>
          </span>
        </div>

        {pattern.subcategories.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Breakdown
            </p>
            <div className="space-y-1">
              {pattern.subcategories.slice(0, 4).map((s) => (
                <div key={s.subcategory} className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-orange-500/60"
                    style={{ width: `${Math.round((s.count / pattern.count) * 100)}%`, minWidth: "8px", maxWidth: "120px" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {s.subcategory.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-medium ml-auto">{s.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            First seen{" "}
            {formatDistanceToNow(new Date(pattern.firstSeen), { addSuffix: true })}
            {" · "}Last{" "}
            {formatDistanceToNow(new Date(pattern.lastSeen), { addSuffix: true })}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
              <Link href={`/dashboard/alerts?agent=${pattern.agentId}&category=${pattern.category}`}>
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
