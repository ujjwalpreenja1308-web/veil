import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

// Server-side client with service role — bypasses RLS for trusted server code
export const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
