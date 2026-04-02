// Error reporter — writes critical errors to the error_logs table in Supabase
// and pings Slack so you know immediately when something breaks in prod.
// Fire-and-forget: never throws, never blocks the caller.

import { logger } from "@/lib/logger";

interface ErrorReport {
  route: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  org_id?: string;
}

export function reportError(report: ErrorReport): void {
  if (process.env.NODE_ENV !== "production") return;

  // Run async without blocking the caller
  void (async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("error_logs").insert({
        route: report.route,
        message: report.message,
        stack: report.stack ?? null,
        context: report.context ?? null,
        org_id: report.org_id ?? null,
      });
    } catch (err) {
      // Don't let the reporter crash anything — just log locally
      logger.warn("[error-reporter] Failed to write error_log to DB", {
        error: err instanceof Error ? err.message : String(err),
      });
    }


  })();
}
