// Client-safe environment variables — safe to import in browser bundles.
// NEXT_PUBLIC_ vars must be accessed as literal strings for Next.js to statically inline them.

function assertSet(name: string, val: string | undefined): string {
  if (!val) throw new Error(`[env] Required environment variable "${name}" is not set`);
  return val;
}

export const clientEnv = {
  get SUPABASE_URL() { return assertSet("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL); },
  get SUPABASE_ANON_KEY() { return assertSet("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); },
} as const;
