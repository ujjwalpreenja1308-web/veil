// E2E test helpers — creates real test orgs and sends events against a running server.
// Requires: SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL set (for org setup)
// and TEST_BASE_URL pointing at the dev/test server (default: http://localhost:3000).

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

// ── Supabase admin client (bypasses RLS, for test setup/teardown only) ─────────
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.\n" +
        "Copy .env.example to .env.test.local and fill in the values."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Test org lifecycle ─────────────────────────────────────────────────────────

export interface TestOrg {
  id: string;
  apiKey: string;
  cleanup: () => Promise<void>;
}

/** Creates a real org row in Supabase and returns its api_key + a cleanup fn. */
export async function createTestOrg(name?: string): Promise<TestOrg> {
  const supabase = getAdminClient();
  const apiKey = "vl_test_" + randomBytes(16).toString("hex");
  const orgName = name ?? `test-org-${randomBytes(4).toString("hex")}`;

  const { data, error } = await supabase
    .from("organizations")
    .insert({ name: orgName, api_key: apiKey, clerk_user_id: null })
    .select()
    .single();

  if (error) throw new Error(`Failed to create test org: ${error.message}`);

  const orgId = (data as { id: string }).id;

  return {
    id: orgId,
    apiKey,
    cleanup: async () => {
      // Delete in dependency order
      const sb = getAdminClient();
      // Get session ids for this org first
      const { data: sessions } = await sb.from("sessions").select("id").eq("org_id", orgId);
      if (sessions?.length) {
        const ids = sessions.map((s: { id: string }) => s.id);
        await sb.from("events").delete().in("session_id", ids);
        await sb.from("classifications").delete().in("session_id", ids);
      }
      await sb.from("sessions").delete().eq("org_id", orgId);
      await sb.from("agents").delete().eq("org_id", orgId);
      await sb.from("organizations").delete().eq("id", orgId);
    },
  };
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

interface IngestPayload {
  session_id: string;
  type: string;
  step?: number;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

export function ingest(apiKey: string, body: IngestPayload) {
  return fetch(`${BASE_URL}/api/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
}

/** Sends a minimal complete session: start → llm.call → session.end */
export async function sendCompleteSession(
  apiKey: string,
  sessionId: string,
  overrides: {
    llmPayload?: Record<string, unknown>;
  } = {}
) {
  const ts = () => new Date().toISOString();

  await ingest(apiKey, { session_id: sessionId, type: "session.start", step: 1, timestamp: ts() });
  await ingest(apiKey, {
    session_id: sessionId,
    type: "llm.call",
    step: 2,
    payload: {
      "gen_ai.usage.cost": 0.001,
      "gen_ai.usage.prompt_tokens": 100,
      "gen_ai.usage.completion_tokens": 50,
      ...overrides.llmPayload,
    },
    timestamp: ts(),
  });
  return ingest(apiKey, { session_id: sessionId, type: "session.end", step: 3, timestamp: ts() });
}

/** Returns a unique arbitrary session ID — the server maps it to a stable UUID */
export function sessionId() {
  return "sess_" + randomBytes(8).toString("hex");
}
