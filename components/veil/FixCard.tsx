"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InspectorFix } from "@/lib/db/schema";

interface Props {
  fix: InspectorFix;
}

const TYPE_LABELS: Record<string, string> = {
  prompt_fix: "Prompt Fix",
  retry_logic: "Retry Logic",
  guardrail: "Guardrail",
  validation: "Validation",
  config_change: "Config Change",
};

const TYPE_COLORS: Record<string, string> = {
  prompt_fix: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  retry_logic: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  guardrail: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  validation: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  config_change: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export function FixCard({ fix }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!fix.code_snippet) return;
    await navigator.clipboard.writeText(fix.code_snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const confidencePct = Math.round(fix.confidence * 100);

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm">{fix.title}</h3>
            <Badge className={`text-xs ${TYPE_COLORS[fix.type] ?? "bg-muted text-muted-foreground"}`}>
              {TYPE_LABELS[fix.type] ?? fix.type}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{confidencePct}% confident</span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{fix.description}</p>

        {/* Addresses */}
        {fix.addresses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Addresses:</span>
            {fix.addresses.map((issue, i) => (
              <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-xs">
                {issue}
              </span>
            ))}
          </div>
        )}

        {/* Code snippet */}
        {fix.code_snippet && (
          <div className="relative">
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {fix.code_snippet}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 p-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
