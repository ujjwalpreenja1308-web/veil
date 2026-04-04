"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronRight, X, BookOpen } from "lucide-react";
import Link from "next/link";

interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  action?: { label: string; href: string };
}

interface OnboardingBannerProps {
  hasAgents: boolean;
  hasSessions: boolean;
  slackConnected: boolean;
}

export function OnboardingBanner({ hasAgents, hasSessions, slackConnected }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("veil_onboarding_dismissed") === "1";
  });

  const isBlankSlate = !hasAgents && !hasSessions && !slackConnected;

  const steps: Step[] = [
    {
      id: "install",
      label: "Install the SDK",
      description: "pip install veil-sdk",
      done: hasAgents, // proxy: if agents exist, SDK was used
      action: { label: "View quickstart", href: `${process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.veil.dev"}/quickstart` },
    },
    {
      id: "first_session",
      label: "Run your first agent",
      description: "Send telemetry from your agent to Veil",
      done: hasSessions,
    },
    {
      id: "slack",
      label: "Connect Slack alerts",
      description: "Get notified when your agents fail",
      done: slackConnected,
      action: { label: "Connect Slack", href: "/dashboard/settings" },
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) return null;

  function dismiss() {
    localStorage.setItem("veil_onboarding_dismissed", "1");
    setDismissed(true);
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Get started with Veil</span>
            <Badge variant="outline" className="text-xs">
              {completedCount}/{steps.length} done
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mt-0.5" onClick={dismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {isBlankSlate && (
          <a
            href={process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.veil.dev"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-background px-4 py-3 mb-4 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">New here? Start with the docs</p>
              <p className="text-xs text-muted-foreground">
                Learn how to connect your first agent in under 2 minutes.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </a>
        )}

        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${step.done ? "text-muted-foreground line-through" : "font-medium"}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
              {!step.done && step.action && (
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0 gap-1" asChild>
                  <Link href={step.action.href}>
                    {step.action.label} <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
