// Client-safe environment variables — safe to import in browser bundles.
// NEXT_PUBLIC_ vars are baked into the bundle at build time by Next.js.

function requireClientEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`[env] Required environment variable "${name}" is not set`);
  return val;
}

export const clientEnv = {
  get SUPABASE_URL() { return requireClientEnv("NEXT_PUBLIC_SUPABASE_URL"); },
  get SUPABASE_ANON_KEY() { return requireClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
} as const;
