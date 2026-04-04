// Zapier webhook normalizer
// Translates Zapier's "Webhooks by Zapier" POST payload into Veil NormalizedEvents.
//
// Zapier sends flat key-value JSON from a "Webhooks by Zapier" POST action.
// Engineers configure the Zap to send fields matching the Veil schema.
//
// Minimum required fields from Zapier:
//   session_id  — unique run identifier (use Zapier's built-in {{zap_meta_human_title}} or a step ID)
//   type        — event type: "llm.call" | "tool.call" | "retrieval" | "session.end" | etc.
//
// Optional enrichment fields (all flat, no nesting required):
//   agent_name, model, input, output, error, tool_name,
//   prompt_tokens, completion_tokens, cost, duration_ms
//
// Zapier also wraps bulk payloads in an array when using "Send Array":
//   [{ session_id, type, ...fields }, ...]
//
// A synthetic session.end is automatically appended if the payload contains
// status: "success" or status: "error" without an explicit session.end event.

import type { NormalizedEvent } from "./index";

interface ZapierEvent {
  session_id?: string;
  type?: string;
  agent_name?: string;
  model?: string;
  input?: string;
  prompt?: string;
  output?: string;
  completion?: string;
  error?: string;
  tool_name?: string;
  prompt_tokens?: string | number;
  completion_tokens?: string | number;
  cost?: string | number;
  duration_ms?: string | number;
  timestamp?: string;
  step?: string | number;
  // top-level status emitted by some Zapier zap templates
  status?: "success" | "error" | "running";
  [key: string]: unknown;
}

const ZAPIER_MAX_PAYLOAD_BYTES = 512_000; // 512 KB

function applyZapierAliases(e: ZapierEvent): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  // Pass through everything first, then map to canonical names
  for (const [k, v] of Object.entries(e)) {
    if (v !== undefined && v !== "") out[k] = v;
  }

  if (e.model && !out["gen_ai.request.model"]) out["gen_ai.request.model"] = e.model;
  if ((e.input ?? e.prompt) && !out["gen_ai.prompt"]) out["gen_ai.prompt"] = e.input ?? e.prompt;
  if ((e.output ?? e.completion) && !out["gen_ai.completion"]) out["gen_ai.completion"] = e.output ?? e.completion;
  if (e.error && !out["gen_ai.error.message"]) out["gen_ai.error.message"] = e.error;
  if (e.tool_name && !out["gen_ai.tool.name"]) out["gen_ai.tool.name"] = e.tool_name;
  if (e.cost != null && !out["gen_ai.usage.cost"]) out["gen_ai.usage.cost"] = Number(e.cost);
  if (e.prompt_tokens != null && !out["gen_ai.usage.prompt_tokens"]) out["gen_ai.usage.prompt_tokens"] = Number(e.prompt_tokens);
  if (e.completion_tokens != null && !out["gen_ai.usage.completion_tokens"]) out["gen_ai.usage.completion_tokens"] = Number(e.completion_tokens);
  if (e.duration_ms != null && !out["duration_ns"]) out["duration_ns"] = Number(e.duration_ms) * 1_000_000;

  return out;
}

function normalizeOneZapierEvent(e: ZapierEvent, fallbackStep: number): NormalizedEvent {
  const sessionId = e.session_id;
  if (!sessionId || typeof sessionId !== "string") {
    throw Object.assign(
      new Error("Zapier payload missing 'session_id'. Add it to your Zapier webhook POST body."),
      { status: 422 }
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId) || sessionId.length > 128) {
    throw Object.assign(
      new Error("session_id may only contain letters, numbers, hyphens and underscores (max 128 chars)"),
      { status: 422 }
    );
  }

  const type = e.type ?? "span";
  const step = e.step != null ? Number(e.step) : fallbackStep;
  const timestamp = e.timestamp ? new Date(e.timestamp) : new Date();

  if (isNaN(timestamp.getTime())) {
    throw Object.assign(new Error("timestamp must be a valid ISO 8601 string"), { status: 422 });
  }

  return {
    sessionId,
    orgId: "",
    step,
    type,
    payload: applyZapierAliases(e),
    timestamp,
  };
}

export function normalizeZapier(raw: unknown): NormalizedEvent[] {
  if (!raw || typeof raw !== "object") {
    throw Object.assign(new Error("Zapier payload must be a JSON object or array"), { status: 422 });
  }

  const rawSize = JSON.stringify(raw).length;
  if (rawSize > ZAPIER_MAX_PAYLOAD_BYTES) {
    throw Object.assign(
      new Error(`Zapier payload exceeds 512KB limit (got ${(rawSize / 1024).toFixed(1)} KB)`),
      { status: 413 }
    );
  }

  // Support both single event and array of events
  const items: ZapierEvent[] = Array.isArray(raw)
    ? (raw as ZapierEvent[])
    : [raw as ZapierEvent];

  if (items.length === 0) {
    throw Object.assign(new Error("Zapier payload array is empty"), { status: 422 });
  }

  const events: NormalizedEvent[] = items.map((item, i) =>
    normalizeOneZapierEvent(item, i + 1)
  );

  // Auto-append session.end if the last event has a terminal status but no explicit session.end
  const last = items[items.length - 1];
  const hasSessionEnd = events.some((e) => e.type === "session.end");

  if (!hasSessionEnd && (last.status === "success" || last.status === "error")) {
    const sessionId = events[events.length - 1].sessionId;
    events.push({
      sessionId,
      orgId: "",
      step: events.length + 1,
      type: "session.end",
      payload: {
        agent_name: last.agent_name ?? "zapier-agent",
        "zapier.status": last.status,
        ...(last.status === "error" && last.error
          ? { "gen_ai.error.message": last.error }
          : {}),
      },
      timestamp: new Date(),
    });
  }

  return events;
}
