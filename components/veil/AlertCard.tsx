"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FailureTypeTag } from "./FailureTypeTag";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { UIClassification } from "@/lib/presenter";
import { usePrefetchSession } from "@/hooks/use-sessions";

const severityColor: Record<string, string> = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
};

interface AlertCardProps {
  classification: UIClassification & {
    session?: { id: string; startedAt: string };
  };
}

export function AlertCard({ classification: c }: AlertCardProps) {
  const prefetchSession = usePrefetchSession();

  return (
    <Link href={`/dashboard/sessions/${c.sessionId}`} className="block">
      <Card onMouseEnter={() => prefetchSession(c.sessionId)}>
        <CardContent className="flex items-start gap-4 py-4">
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 shrink-0 ${severityColor[c.severity] ?? "text-muted-foreground"}`}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FailureTypeTag category={c.category} severity={c.severity} />
              <Badge variant="outline" className="text-xs capitalize">
                {c.severity}
              </Badge>
              {c.session?.startedAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.session.startedAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{c.reason}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
