"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { InspectorFinding } from "@/lib/db/schema";

interface Props {
  finding: InspectorFinding;
  index: number;
}

function SeverityBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.7)
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs shrink-0">{Math.round(confidence * 100)}% confident</Badge>;
  if (confidence >= 0.5)
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs shrink-0">{Math.round(confidence * 100)}% confident</Badge>;
  return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs shrink-0">{Math.round(confidence * 100)}% confident</Badge>;
}

export function FindingCard({ finding, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-l-2 border-l-orange-500/50">
      <CardContent className="pt-4 pb-4">
        <button
          className="w-full text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">#{index}</span>
              <div className="min-w-0">
                <p className="font-medium text-sm">{finding.issue}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{finding.impact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <SeverityBadge confidence={finding.confidence} />
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Why */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Root Cause</p>
              <p className="text-sm">{finding.why}</p>
            </div>

            {/* Causal chain */}
            {finding.causal_chain.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Causal Chain</p>
                <div className="flex flex-wrap items-center gap-1">
                  {finding.causal_chain.map((step, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{step}</span>
                      {i < finding.causal_chain.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {finding.evidence && finding.evidence.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Evidence</p>
                <div className="space-y-1">
                  {finding.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Link2 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <span>
                        <span className="font-mono text-muted-foreground">{ev.session_id.slice(0, 8)}…</span>
                        {" · "}
                        <span className="text-muted-foreground">{ev.issue_type}</span>
                        {" · "}
                        <span>{ev.signal}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related pattern */}
            {finding.related_pattern && (
              <p className="text-xs text-muted-foreground">
                Pattern: <span className="font-medium">{finding.related_pattern}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
