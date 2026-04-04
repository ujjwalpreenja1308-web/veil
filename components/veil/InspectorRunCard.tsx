import { Clock, Layers, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { InspectorRun } from "@/lib/db/schema";

interface Props {
  run: InspectorRun;
  agentName: string;
  onClick: () => void;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "complete")
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 shrink-0">Complete</Badge>;
  if (status === "failed")
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shrink-0">Failed</Badge>;
  if (status === "running")
    return (
      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 shrink-0 gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </Badge>
    );
  return <Badge variant="secondary" className="shrink-0">Pending</Badge>;
}

function timeAgo(date: Date | string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function InspectorRunCard({ run, agentName, onClick }: Props) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{agentName}</span>
            <StatusBadge status={run.status} />
          </div>
          <div className="flex items-center gap-x-4 gap-y-0.5 mt-1 flex-wrap text-xs text-muted-foreground">
            {run.sessions_analyzed != null && (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {run.sessions_analyzed} session{run.sessions_analyzed !== 1 ? "s" : ""}
              </span>
            )}
            {run.findings && run.findings.length > 0 && (
              <span>{run.findings.length} finding{run.findings.length !== 1 ? "s" : ""}</span>
            )}
            {run.fixes && run.fixes.length > 0 && (
              <span>{run.fixes.length} fix{run.fixes.length !== 1 ? "es" : ""}</span>
            )}
            {run.error && (
              <span className="text-red-400 truncate max-w-xs">{run.error}</span>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {timeAgo(run.created_at)}
        </span>
      </CardContent>
    </Card>
  );
}
