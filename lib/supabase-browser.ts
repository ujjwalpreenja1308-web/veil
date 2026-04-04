// Browser-safe Supabase client — uses anon key, suitable for Realtime subscriptions
// Only used client-side. Server code must use lib/supabase.ts (service role).
import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";

const supabaseUrl = clientEnv.SUPABASE_URL;
const supabaseAnonKey = clientEnv.SUPABASE_ANON_KEY;

// Singleton — re-use across the app to avoid multiple websocket connections
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return _client;
}
