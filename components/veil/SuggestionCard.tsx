"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Copy, CheckCheck, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateClassification } from "@/hooks/use-classifications";
import { getSuggestion } from "@/lib/suggestions/templates";
import { formatDistanceToNow } from "date-fns";
import type { UIClassification } from "@/lib/presenter";

interface SuggestionCardProps {
  classification: UIClassification;
  sessionId: string;
}

export function SuggestionCard({ classification, sessionId }: SuggestionCardProps) {
  const suggestion = getSuggestion(classification.category);
  const [copied, setCopied] = useState(false);
  const update = useUpdateClassification(sessionId);

  if (!suggestion) return null;

  const alreadyApplied = classification.suggestionApplied;

  function handleCopy() {
    navigator.clipboard.writeText(suggestion!.snippet).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMarkApplied() {
    update.mutate(
      { classificationId: classification.id, updates: { suggestion_applied: true } },
      { onSuccess: () => toast.success("Marked as applied") }
    );
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
          Suggested improvement
          {alreadyApplied && (
            <Badge variant="outline" className="ml-auto text-xs border-green-500/50 text-green-500">
              <Check className="h-3 w-3 mr-1" />
              Applied
              {classification.suggestionAppliedAt && (
                <span className="ml-1 text-muted-foreground">
                  {formatDistanceToNow(new Date(classification.suggestionAppliedAt), { addSuffix: true })}
                </span>
              )}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{suggestion.title}</p>
        <p className="text-sm text-muted-foreground">{suggestion.whatHappened}</p>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {suggestion.snippetLabel}
          </p>
          <pre className="rounded-md bg-muted px-3 py-2.5 text-xs font-mono whitespace-pre-wrap leading-relaxed text-foreground">
            {suggestion.snippet}
          </pre>
        </div>

        {!alreadyApplied && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
              {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy snippet"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkApplied}
              disabled={update.isPending}
              className="gap-1.5 border-green-500/50 text-green-500 hover:bg-green-500/10"
            >
              {update.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Mark as applied
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
