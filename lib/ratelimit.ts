// Rate limiting — per api_key sliding window
// Uses Upstash Redis when configured (distributed, works across instances)
// Falls back to in-memory sliding window (per-instance, always enforced)
import { logger } from "@/lib/logger";

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 100;  // per api_key per window
const IN_MEMORY_MAX_KEYS = 10_000; // cap Map size to prevent unbounded growth

// ── In-memory fallback ────────────────────────────────────────────────────────
// Stores an array of timestamps per key; evicts old entries on each check.
// NOTE: In serverless environments (Vercel) each cold start gets a fresh Map,
// so this is only effective for long-lived single-instance deployments.
// When UPSTASH_REDIS_REST_URL is set, Redis is used instead.
const inMemoryWindows = new Map<string, number[]>();

function inMemoryLimit(key: string): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (inMemoryWindows.get(key) ?? []).filter((t) => t > cutoff);
  const reset = now + WINDOW_MS;

  if (timestamps.length >= MAX_REQUESTS) {
    inMemoryWindows.set(key, timestamps);
    return { success: false, remaining: 0, reset };
  }

  // Evict oldest key if we're at the cap (simple LRU approximation)
  if (!inMemoryWindows.has(key) && inMemoryWindows.size >= IN_MEMORY_MAX_KEYS) {
    const oldestKey = inMemoryWindows.keys().next().value;
    if (oldestKey) inMemoryWindows.delete(oldestKey);
  }

  timestamps.push(now);
  inMemoryWindows.set(key, timestamps);
  return { success: true, remaining: MAX_REQUESTS - timestamps.length, reset };
}

// Prune stale keys every 5 minutes to prevent memory accumulation
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, timestamps] of inMemoryWindows) {
    if (timestamps.every((t) => t <= cutoff)) inMemoryWindows.delete(key);
  }
}, 5 * 60_000).unref?.();

// ── Upstash Redis (optional, distributed) ────────────────────────────────────
type LimitResult = { success: boolean; limit: number; remaining: number; reset: number };

// Lazy-initialized promise — ensures the first request always waits for Redis
// to be ready rather than falling through to in-memory on cold starts.
let upstashLimitPromise: Promise<((key: string) => Promise<LimitResult>) | null> | null = null;

function getUpstashLimit(): Promise<((key: string) => Promise<LimitResult>) | null> {
  if (upstashLimitPromise) return upstashLimitPromise;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn("[ratelimit] Using in-memory rate limiting (100 req/min per api_key) — ineffective on serverless without Upstash");
    upstashLimitPromise = Promise.resolve(null);
    return upstashLimitPromise;
  }

  upstashLimitPromise = Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]).then(([{ Ratelimit }, { Redis }]) => {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
      prefix: "veil:rl",
      analytics: true,
    });
    logger.info("[ratelimit] Upstash Redis rate limiting active (distributed)");
    return (key: string) => rl.limit(key);
  }).catch((err) => {
    logger.warn("[ratelimit] Failed to init Upstash — using in-memory fallback", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  });

  return upstashLimitPromise;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function checkRateLimit(apiKey: string): Promise<LimitResult> {
  const upstashLimit = await getUpstashLimit();

  if (upstashLimit) {
    try {
      return await upstashLimit(apiKey);
    } catch (err) {
      // Redis error — fall through to in-memory so we don't fail open entirely
      logger.warn("[ratelimit] Upstash error, falling back to in-memory", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { limit: MAX_REQUESTS, ...inMemoryLimit(apiKey) };
}
