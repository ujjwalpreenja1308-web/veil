// In-memory circuit breaker for external alert delivery (Slack, Email via Composio)
// Prevents hammering a down service on every ingest request.
// State is per-process — resets on cold start (acceptable for serverless).
import { logger } from "@/lib/logger";

interface BreakerState {
  failures: number;
  openUntil: number; // epoch ms — 0 means closed
}

const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS = 60_000; // stay open for 60s before allowing a retry

const breakers = new Map<string, BreakerState>();

function getState(key: string): BreakerState {
  if (!breakers.has(key)) breakers.set(key, { failures: 0, openUntil: 0 });
  return breakers.get(key)!;
}

export function isOpen(key: string): boolean {
  const state = getState(key);
  if (state.openUntil > 0 && Date.now() < state.openUntil) return true;
  if (state.openUntil > 0 && Date.now() >= state.openUntil) {
    // Half-open: allow one probe through
    state.openUntil = 0;
  }
  return false;
}

export function recordSuccess(key: string): void {
  const state = getState(key);
  state.failures = 0;
  state.openUntil = 0;
}

export function recordFailure(key: string): void {
  const state = getState(key);
  state.failures += 1;
  if (state.failures >= FAILURE_THRESHOLD) {
    state.openUntil = Date.now() + OPEN_DURATION_MS;
    logger.warn(`[circuit-breaker] ${key} opened after ${state.failures} failures — pausing for ${OPEN_DURATION_MS / 1000}s`);
  }
}
