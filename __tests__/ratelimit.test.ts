import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment — no Redis configured so in-memory path is exercised
vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

// Re-import after stubbing env
const { checkRateLimit } = await import("@/lib/ratelimit");

describe("checkRateLimit() — in-memory fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests under the limit", async () => {
    const result = await checkRateLimit("test-key-allow");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("returns success=false after exceeding 100 requests", async () => {
    const key = `overload-key-${Date.now()}`;
    // Exhaust the limit
    for (let i = 0; i < 100; i++) {
      await checkRateLimit(key);
    }
    // 101st request should be rejected
    const result = await checkRateLimit(key);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", async () => {
    const key1 = `key-a-${Date.now()}`;
    const key2 = `key-b-${Date.now()}`;

    for (let i = 0; i < 100; i++) {
      await checkRateLimit(key1);
    }

    // key2 should still be allowed
    const result = await checkRateLimit(key2);
    expect(result.success).toBe(true);
  });

  it("returns a reset timestamp in the future", async () => {
    const result = await checkRateLimit(`future-reset-${Date.now()}`);
    expect(result.reset).toBeGreaterThan(Date.now());
  });
});
