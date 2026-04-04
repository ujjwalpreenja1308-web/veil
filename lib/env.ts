// Centralized environment variable validation.
// Import this module to trigger validation at startup — missing required vars
// will throw immediately with a clear message rather than failing on first use.

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`[env] Required environment variable "${name}" is not set`);
  return val;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

// ── Server-only vars ──────────────────────────────────────────────────────────
// These are validated at module load time. Import this file in instrumentation.ts
// to fail fast on cold start rather than on first request.
export const serverEnv = {
  SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  CLERK_WEBHOOK_SECRET: requireEnv("CLERK_WEBHOOK_SECRET"),

  // Optional — app degrades gracefully if missing, but logs errors
  RESEND_API_KEY: optionalEnv("RESEND_API_KEY"),
  COMPOSIO_API_KEY: optionalEnv("COMPOSIO_API_KEY"),
  UPSTASH_REDIS_REST_URL: optionalEnv("UPSTASH_REDIS_REST_URL"),
  UPSTASH_REDIS_REST_TOKEN: optionalEnv("UPSTASH_REDIS_REST_TOKEN"),
  INSPECTOR_SERVICE_URL: optionalEnv("INSPECTOR_SERVICE_URL"),
  INSPECTOR_API_KEY: optionalEnv("INSPECTOR_API_KEY"),
  CRON_SECRET: requireEnv("CRON_SECRET"),
} as const;

// ── Client-safe vars ──────────────────────────────────────────────────────────
// Safe to access in browser bundles (NEXT_PUBLIC_ prefix).
export const clientEnv = {
  SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
} as const;
