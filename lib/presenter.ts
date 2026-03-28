// Presentation layer — transforms raw DB records into clean UI-safe shapes.
// This is the boundary that ensures OpenLIT/OTLP internals never surface in the frontend.

import type { Event, Session, Classification } from "@/lib/db/schema";
import { FAILURE_CATEGORIES } from "@/lib/rules/categories";
import type { FailureCategory } from "@/lib/rules/categories";

// ─── Event ────────────────────────────────────────────────────────────────────

export interface UIEvent {
  id: string;
  step: number;
  type: string;          // human-readable label
  timestamp: string;
  durationMs: number | null;
  model: string | null;
  provider: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  cost: number | null;
  error: string | null;
}

export function presentEvent(e: Event): UIEvent {
  const p = e.payload;
  const durationNs = Number(p.duration_ns ?? 0);

  return {
    id: e.id,
    step: e.step,
    type: labelEventType(e.type),
    timestamp: String(e.timestamp),
    durationMs: durationNs > 0 ? Math.round(durationNs / 1_000_000) : null,
    model: strOrNull(p["gen_ai.request.model"] ?? p["llm.model"] ?? p.model),
    provider: strOrNull(p["gen_ai.system"] ?? p.provider),
    promptTokens: numOrNull(p["gen_ai.usage.prompt_tokens"] ?? p["llm.usage.prompt_tokens"]),
    completionTokens: numOrNull(p["gen_ai.usage.completion_tokens"] ?? p["llm.usage.completion_tokens"]),
    cost: numOrNull(p["gen_ai.usage.cost"] ?? p.cost),
    error: strOrNull(p["gen_ai.error.message"] ?? p.error_message ?? p.error),
  };
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface UISession {
  id: string;
  agentId: string;
  agentName: string | null;
  status: Session["status"];
  failureType: string | null;
  failureLabel: string | null;
  cost: number;
  durationMs: number;
  startedAt: string;
  completedAt: string | null;
}

export function presentSession(s: Session & { agent?: { name?: string } | null }): UISession {
  // Duration: prefer completed_at - started_at over stored duration_ms
  let durationMs = s.duration_ms ?? 0;
  if (s.completed_at && s.started_at) {
    const computed = new Date(s.completed_at).getTime() - new Date(s.started_at).getTime();
    if (computed > 0) durationMs = computed;
  }

  return {
    id: s.id,
    agentId: s.agent_id,
    agentName: s.agent?.name ?? null,
    status: s.status,
    failureType: s.failure_type ?? null,
    failureLabel: s.failure_type
      ? (FAILURE_CATEGORIES[s.failure_type as FailureCategory] ?? s.failure_type)
      : null,
    cost: Number(s.cost ?? 0),
    durationMs,
    startedAt: String(s.started_at),
    completedAt: s.completed_at ? String(s.completed_at) : null,
  };
}

// ─── Classification ───────────────────────────────────────────────────────────

export interface UIClassification {
  id: string;
  sessionId: string;
  category: string;
  categoryLabel: string;
  subcategory: string;
  severity: Classification["severity"];
  reason: string;
}

export function presentClassification(c: Classification): UIClassification {
  return {
    id: c.id,
    sessionId: c.session_id,
    category: c.category,
    categoryLabel: FAILURE_CATEGORIES[c.category as FailureCategory] ?? c.category,
    subcategory: c.subcategory,
    severity: c.severity,
    reason: c.reason,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function strOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v);
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// Returns null for spans that should be hidden from the timeline (raw HTTP, internal spans)
export function shouldShowEvent(type: string): boolean {
  const t = type.toLowerCase();
  // Hide raw HTTP spans that OpenLIT emits for its own transport
  if (t === "post" || t === "get" || t === "http" || t.startsWith("http.")) return false;
  // Hide internal opentelemetry spans
  if (t.startsWith("otlp") || t.startsWith("otel")) return false;
  return true;
}

function labelEventType(type: string): string {
  const map: Record<string, string> = {
    "llm.call": "LLM Call",
    "tool.call": "Tool Call",
    "tool.result": "Tool Result",
    "retrieval": "Retrieval",
    "session.end": "Session End",
    "span": "Span",
  };
  // Handle OpenLIT span names like "openai.chat.completions" → "OpenAI Chat"
  if (type.startsWith("openai")) return "OpenAI Call";
  if (type.startsWith("anthropic")) return "Anthropic Call";
  if (type.includes("retriev")) return "Retrieval";
  if (type.includes("tool")) return "Tool Call";
  if (type.includes("embed")) return "Embedding";
  return map[type] ?? type;
}
