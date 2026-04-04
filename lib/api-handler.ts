// Shared API route utilities — consistent error handling, timeout, retry
//
// ROUTE WRAPPER POLICY
// ─────────────────────────────────────────────────────────────────────────────
// withApiHandler:  Used by all standard authenticated routes (agents, sessions,
//                  classifications, fixes, inspectors, patterns, stats, etc.)
//
// Deliberately NOT used by:
//   /api/health          — public ping, no auth, zero overhead
//   /api/ingest          — SDK hot path; has its own error handling + reportError
//   /api/ingest/otlp*    — OTLP hot path; same reason
//   /api/me              — provisioning bootstrap; must not swallow 401 state
//   /api/keys            — needs full org object (uses getOrgByClerkUser)
//   /api/integrations/*  — webhook-style, custom auth pattern
//   /api/webhooks/clerk  — Svix signature verification, cannot wrap
//   /api/cron/*          — Bearer token auth, not Clerk session
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporter";

// Wrap any async route handler to catch unhandled errors and return structured JSON
export function withApiHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      logger.exception("[api] Unhandled route error", err);
      // Infer route from request URL if available
      const req = args.find((a): a is NextRequest => a instanceof NextRequest);
      reportError({
        route: req?.nextUrl?.pathname ?? "unknown",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

// Retry a promise-returning function with exponential backoff
// Only retries on transient errors (network, DB connection) — not on logic errors
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { attempts = 3, baseDelayMs = 150, label = "operation" } = opts;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        logger.warn(`[retry] ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay}ms`, {
          error: err instanceof Error ? err.message : String(err),
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  logger.exception(`[retry] ${label} failed after ${attempts} attempts`, lastErr);
  throw lastErr;
}

// Race a promise against a timeout — throws if timeout fires first
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  label = "operation"
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    const result = await Promise.race([fn(), timeout]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}
