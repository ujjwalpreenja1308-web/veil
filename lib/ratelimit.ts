// Rate limiting — per api_key sliding window using Upstash Redis
// Fails open when Redis is not configured (env vars empty)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "veil:rl",
    analytics: true,
  });
  logger.info("[ratelimit] Rate limiting enabled (100 req/min per api_key)");
} else {
  logger.warn("[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled (fail open)");
}

export { ratelimit };
