"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useApiKeys } from "@/hooks/use-keys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, KeyRound, RotateCcw, Eye } from "lucide-react";

export default function SettingsPage() {
  const { data: keys, isLoading } = useApiKeys();
  const queryClient = useQueryClient();
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  async function rotateKey() {
    if (!confirm("Rotating your API key will immediately invalidate the current key. Your SDK will stop working until you update it. Continue?")) return;

    setRotating(true);
    setRevealedKey(null);

    try {
      const res = await fetch("/api/keys", { method: "POST" });
      if (!res.ok) throw new Error("Rotation failed");
      const data = await res.json();
      setRevealedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ["keys"] });
      toast.success("API key rotated — copy it now");
    } catch {
      toast.error("Failed to rotate key");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization and API keys.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Use your API key with{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {'veil.init(api_key="…")'}
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revealed key — shown once after rotation */}
          {revealedKey && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 space-y-2">
              <p className="text-xs font-medium text-yellow-500 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Copy this key now — it won&apos;t be shown again
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono break-all text-foreground">{revealedKey}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(revealedKey);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Masked key */}
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : !keys?.length ? (
            <p className="text-sm text-muted-foreground">No API keys found.</p>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <code className="flex-1 text-sm font-mono text-muted-foreground">{key.masked}</code>
                <span className="text-xs text-muted-foreground shrink-0">{key.label}</span>
              </div>
            ))
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={rotateKey}
            disabled={rotating}
            className="gap-2"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
            {rotating ? "Rotating…" : "Rotate Key"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SDK Quickstart</CardTitle>
          <CardDescription>Get started in one line of Python.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto leading-relaxed">
            {`pip install veil-sdk\n\nimport veil\nveil.init(api_key="vl_your_key_here")`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
