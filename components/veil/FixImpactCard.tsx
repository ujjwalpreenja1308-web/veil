"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, TrendingDown, TrendingUp, Minus, Trash2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { FailureTypeTag } from "./FailureTypeTag";
import { useDeleteFix } from "@/hooks/use-fixes";
import { toast } from "sonner";
import type { FixWithImpact } from "@/hooks/use-fixes";

interface FixImpactCardProps {
  fix: FixWithImpact;
}

export function FixImpactCard({ fix }: FixImpactCardProps) {
  const deleteFix = useDeleteFix();
  const [confirming, setConfirming] = useState(false);
  const impact = fix.impact;

  const delta = impact?.deltaPercent ?? null;
  const hasData = impact && (impact.beforeCount > 0 || impact.afterCount > 0);

  function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    deleteFix.mutate(fix.id, {
      onSuccess: () => toast.success("Fix removed"),
      onError: () => toast.error("Failed to remove fix"),
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-semibold truncate max-w-sm">{fix.description}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {delta !== null && (
              <Badge
                variant="outline"
                className={
                  delta < 0
                    ? "border-green-500/50 text-green-500"
                    : delta > 0
                    ? "border-red-500/50 text-red-500"
                    : "border-muted text-muted-foreground"
                }
              >
                {delta < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : delta > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <Minus className="h-3 w-3 mr-1" />
                )}
                {delta < 0 ? `${Math.abs(delta)}% fewer` : delta > 0 ? `${delta}% more` : "no change"}
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteFix.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FailureTypeTag category={fix.category} severity="medium" />
          <span className="text-xs text-muted-foreground">
            Applied {formatDistanceToNow(new Date(fix.applied_at), { addSuffix: true })}
            {" · "}
            {format(new Date(fix.applied_at), "MMM d, yyyy")}
          </span>
        </div>

        {hasData ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Before fix</p>
              <p className="text-2xl font-bold">{impact!.beforeCount}</p>
              <p className="text-xs text-muted-foreground">in {impact!.beforeDays} days</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">After fix</p>
              <p className="text-2xl font-bold">{impact!.afterCount}</p>
              <p className="text-xs text-muted-foreground">in {impact!.afterDays} days</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Not enough data yet. Impact will appear once failures have been tracked before and after this fix.
          </p>
        )}

        {delta !== null && delta < -20 && (
          <p className="text-xs text-green-500 font-medium">
            ✓ Your fix appears to be working.
          </p>
        )}
        {delta !== null && delta >= 0 && hasData && impact!.beforeCount > 0 && (
          <p className="text-xs text-muted-foreground">
            No improvement detected yet. Failures continue at a similar rate.
          </p>
        )}

        {confirming && (
          <p className="text-xs text-destructive">
            Click again to confirm deletion.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
