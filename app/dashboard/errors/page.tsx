"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ErrorLog {
  id: string;
  route: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown> | null;
  org_id: string | null;
  created_at: string;
}

function useErrorLogs() {
  return useQuery({
    queryKey: ["admin-errors"],
    queryFn: () => apiFetch<{ errors: ErrorLog[] }>("/api/admin/errors"),
    select: (d) => d.errors,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export default function ErrorsPage() {
  const { data: errors, isLoading } = useErrorLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
        <p className="text-muted-foreground mt-1">Production errors — last 30 days.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="py-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : !errors?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No errors</h3>
            <p className="text-sm text-muted-foreground">All systems operating normally.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {errors.map((e) => (
            <Card key={e.id} className="border-red-500/20">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className="font-mono text-xs border-red-500/40 text-red-500">
                        {e.route}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </span>
                      {e.org_id && (
                        <span className="text-xs text-muted-foreground font-mono">
                          org: {e.org_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{e.message}</p>
                  </div>
                </div>

                {e.stack && (
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 rounded-md bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-48">
                      {e.stack}
                    </pre>
                  </details>
                )}

                {e.context && Object.keys(e.context).length > 0 && (
                  <details>
                    <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                      Context
                    </summary>
                    <pre className="mt-2 rounded-md bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-32">
                      {JSON.stringify(e.context, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
