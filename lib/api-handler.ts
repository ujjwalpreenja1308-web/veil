// Shared API route utilities — consistent error handling, timeout, retry
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Wrap any async route handler to catch unhandled errors and return structured JSON
export function withApiHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      logger.exception("[api] Unhandled route error", err);
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
