"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, FlaskConical, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { InspectorRunCard } from "@/components/veil/InspectorRunCard";
import { useAgents } from "@/hooks/use-agents";
import { useInspectorRuns, useRunInspector } from "@/hooks/use-inspector-runs";

export default function InspectorsPage() {
  const router = useRouter();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  const agents = agentsData ?? [];

  const { data: runsData, isLoading: runsLoading } = useInspectorRuns(selectedAgentId || undefined);
  const runs = runsData?.runs ?? [];

  const runInspector = useRunInspector();

  async function handleRun() {
    if (!selectedAgentId) return;
    const result = await runInspector.mutateAsync({ agent_id: selectedAgentId });
    if (result?.run?.id) {
      router.push(`/dashboard/inspectors/${result.run.id}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inspector</h1>
        <p className="text-muted-foreground mt-1">
          Deep analysis of your AI agents — finds root causes, recurring patterns, and generates actionable fixes.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {agentsLoading ? (
              <Skeleton className="h-9 w-full sm:w-72" />
            ) : (
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Select an agent to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={handleRun}
              disabled={!selectedAgentId || runInspector.isPending}
              className="gap-2 shrink-0"
            >
              {runInspector.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Run Inspector
                </>
              )}
            </Button>
          </div>
          {selectedAgentId && (
            <p className="text-xs text-muted-foreground mt-3">
              Inspector will analyze all sessions from the last 72 hours for this agent.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Analysis History</h2>

        {runsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No analysis runs yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {selectedAgentId
                  ? "No runs found for this agent. Select it above and click Run Inspector to start."
                  : "Select an agent above and click Run Inspector to analyze its sessions."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => (
              <InspectorRunCard
                key={run.id}
                run={run}
                agentName={agents.find((a) => a.id === run.agent_id)?.name ?? run.agent_id}
                onClick={() => router.push(`/dashboard/inspectors/${run.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
