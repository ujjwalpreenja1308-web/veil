export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate required env vars at startup — throws with a clear message if missing
    await import("@/lib/env");

    if (!process.env.UPSTASH_REDIS_REST_URL) {
      const { logger } = await import("@/lib/logger");
      logger.warn(
        "[startup] UPSTASH_REDIS_REST_URL not configured — rate limiting will be per-instance " +
          "(ineffective on serverless). Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for production."
      );
    }
  }
}
