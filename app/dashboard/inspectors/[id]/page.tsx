"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle, Clock, Cpu, Layers, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingCard } from "@/components/veil/FindingCard";
import { FixCard } from "@/components/veil/FixCard";
import { useInspectorRun } from "@/hooks/use-inspector-runs";
import { useEffect, useRef, useState } from "react";

function StatusBadge({ status }: { status: string }) {
  if (status === "complete")
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Complete</Badge>;
  if (status === "failed")
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
  if (status === "running")
    return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse">Running</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function ElapsedTimer({ startedAt }: { startedAt: Date | string }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return <span>{mins > 0 ? `${mins}m ` : ""}{secs}s elapsed</span>;
}

export default function InspectorRunPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useInspectorRun(params.id);
  const run = data?.run;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/inspectors">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Inspector
          </Button>
        </Link>
        <p className="text-muted-foreground">Run not found.</p>
      </div>
    );
  }

  const isPending = run.status === "pending" || run.status === "running";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/inspectors">
          <Button variant="ghost" size="sm" className="gap-2 shrink-0">
            <ArrowLeft className="h-4 w-4" /> Inspector
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">Analysis Run</h1>
            <StatusBadge status={run.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {run.sessions_analyzed != null && (
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {run.sessions_analyzed} session{run.sessions_analyzed !== 1 ? "s" : ""} analyzed
              </span>
            )}
            {run.latency_ms != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {(run.latency_ms / 1000).toFixed(1)}s
              </span>
            )}
            {run.model && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                {run.model}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* In-progress state */}
      {isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <div>
              <h3 className="text-lg font-medium">Analyzing agent sessions…</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The Inspector crew is reading traces, detecting patterns, and generating fixes.
                <br />
                <span className="font-mono text-xs mt-1 block">
                  <ElapsedTimer startedAt={run.created_at} />
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <p>Step 1 of 4: Compressing session data</p>
              <p>Step 2 of 4: Extracting issues</p>
              <p>Step 3 of 4: Detecting patterns</p>
              <p>Step 4 of 4: Generating root causes &amp; fixes</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {run.status === "failed" && (
        <Card className="border-red-500/20">
          <CardContent className="flex items-start gap-3 py-4">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Analysis failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{run.error ?? "Unknown error"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete: results */}
      {run.status === "complete" && (
        <>
          {/* Summary */}
          {run.summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{run.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Findings */}
          {run.findings && run.findings.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Findings
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {run.findings.length} issue{run.findings.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <div className="space-y-2">
                {run.findings.map((finding, i) => (
                  <FindingCard key={i} finding={finding} index={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {run.patterns && run.patterns.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Patterns
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  recurring across sessions
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {run.patterns.map((pattern, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm">{pattern.name}</h3>
                        <div className="flex gap-1.5 shrink-0">
                          <Badge variant="secondary" className="text-xs">{pattern.frequency}×</Badge>
                          <Badge
                            className={`text-xs ${
                              pattern.severity === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              pattern.severity === "high" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                              pattern.severity === "medium" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {pattern.severity}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                      {pattern.evidence_summary && (
                        <p className="text-xs text-muted-foreground/70 mt-2 italic">{pattern.evidence_summary}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {pattern.affected_sessions.length} session{pattern.affected_sessions.length !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Fixes */}
          {run.fixes && run.fixes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Fixes
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ready to apply
                </span>
              </h2>
              <div className="space-y-3">
                {run.fixes.map((fix, i) => (
                  <FixCard key={i} fix={fix} />
                ))}
              </div>
            </div>
          )}

          {/* Empty complete state */}
          {(!run.findings || run.findings.length === 0) &&
           (!run.fixes || run.fixes.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No issues found</h3>
                <p className="text-sm text-muted-foreground">
                  The Inspector didn&apos;t detect any significant issues in the analyzed sessions.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
