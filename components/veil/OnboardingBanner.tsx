"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";
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

  const steps: Step[] = [
    {
      id: "install",
      label: "Install the SDK",
      description: "pip install veil-sdk",
      done: hasAgents, // proxy: if agents exist, SDK was used
      action: { label: "View quickstart", href: "/dashboard/settings" },
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
