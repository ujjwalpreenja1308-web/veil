// OpenLIT normalization layer
// All OpenLIT types are contained here — never leak outside this module

export interface NormalizedEvent {
  sessionId: string;
  orgId: string;
  step: number;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

// Raw shape coming from the OpenLIT / OTLP ingest payload
interface AttrValue {
  stringValue?: string;
  intValue?: number;
  doubleValue?: number;
  boolValue?: boolean;
}

interface RawAttr {
  key: string;
  value: AttrValue;
}

interface RawSpan {
  traceId?: string;
  spanId?: string;
  name?: string;
  kind?: number;
  startTimeUnixNano?: string | number;
  endTimeUnixNano?: string | number;
  attributes?: RawAttr[];
  status?: { code?: number; message?: string };
  [key: string]: unknown;
}

interface RawResource {
  attributes?: RawAttr[];
}

interface RawResourceSpan {
  resource?: RawResource;
  scopeSpans?: Array<{ spans?: RawSpan[] }>;
}

interface RawOtlpPayload {
  resourceSpans?: RawResourceSpan[];
}

interface RawVeilPayload {
  session_id?: string;
  org_id?: string;
  step?: number;
  type?: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

function extractAttr(attrs: RawAttr[] | undefined, key: string): string | number | boolean | undefined {
  const found = attrs?.find((a) => a.key === key);
  if (!found) return undefined;
  const v = found.value;
  return v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue;
}

function flattenAttrs(attrs: RawAttr[] | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  attrs?.forEach((a) => {
    const v = a.value;
    out[a.key] = v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue;
  });
  return out;
}

// 1 MB payload size limit for OTLP (Veil-native uses 10 KB per event)
const OTLP_MAX_PAYLOAD_BYTES = 1_048_576;

// Normalize a single OTLP span into a NormalizedEvent.
// session_id is conveyed via the resource attribute "service.name"
// (which OpenLIT sets from application_name) or span attribute "session.id".
function normalizeSpan(span: RawSpan, resourceAttrs: RawAttr[] | undefined, step: number): NormalizedEvent {
  if (span === null || typeof span !== "object") {
    throw Object.assign(new Error("Malformed OTLP span: expected object"), { status: 422 });
  }

  const spanAttrs = span.attributes;

  // Session ID: prefer span-level, fall back to resource service.name, then traceId
  const rawSessionId =
    extractAttr(spanAttrs, "session.id") ??
    extractAttr(spanAttrs, "gen_ai.session.id") ??
    extractAttr(resourceAttrs, "service.name") ??
    span.traceId;

  if (!rawSessionId) {
    throw Object.assign(
      new Error("OTLP span missing session identifier (session.id attribute, service.name resource attribute, or traceId)"),
      { status: 422 }
    );
  }
  const sessionId = String(rawSessionId);

  const type = String(
    span.name ??
    extractAttr(spanAttrs, "gen_ai.operation.name") ??
    "span"
  );

  const flatPayload = flattenAttrs(spanAttrs);

  // Compute duration from span timestamps; clamp to 0 to prevent negative values
  if (span.startTimeUnixNano && span.endTimeUnixNano) {
    const startNs = Number(span.startTimeUnixNano);
    const endNs = Number(span.endTimeUnixNano);
    if (!isNaN(startNs) && !isNaN(endNs)) {
      flatPayload.duration_ns = Math.max(0, endNs - startNs);
    }
  }

  if (span.status) {
    flatPayload.status_code = span.status.code;
    if (span.status.message) flatPayload.status_message = span.status.message;
  }

  // If status code indicates error, surface it
  if (span.status?.code === 2) {
    flatPayload["gen_ai.error.message"] = span.status.message ?? "error";
  }

  const tsNano = span.startTimeUnixNano;
  const timestamp = tsNano ? new Date(Number(tsNano) / 1_000_000) : new Date();

  return { sessionId, orgId: "", step, type, payload: flatPayload, timestamp };
}

// Normalize a full OTLP ExportTraceServiceRequest into multiple NormalizedEvents.
// Each span becomes one event. Returns all events across all resource spans.
export function normalizeOtlp(raw: unknown): NormalizedEvent[] {
  // Basic shape validation before casting
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw Object.assign(new Error("OTLP payload must be a JSON object"), { status: 422 });
  }

  // Enforce payload size limit
  const rawSize = JSON.stringify(raw).length;
  if (rawSize > OTLP_MAX_PAYLOAD_BYTES) {
    throw Object.assign(
      new Error(`OTLP payload exceeds 1MB limit (got ${(rawSize / 1024).toFixed(1)} KB)`),
      { status: 413 }
    );
  }

  const body = raw as RawOtlpPayload;
  if (!Array.isArray(body.resourceSpans) && body.resourceSpans !== undefined) {
    throw Object.assign(new Error("OTLP payload.resourceSpans must be an array"), { status: 422 });
  }

  const events: NormalizedEvent[] = [];
  let globalStep = 0;

  for (const resourceSpan of body.resourceSpans ?? []) {
    if (!resourceSpan || typeof resourceSpan !== "object") continue;
    const resourceAttrs = resourceSpan.resource?.attributes;
    for (const scopeSpan of resourceSpan.scopeSpans ?? []) {
      if (!scopeSpan || typeof scopeSpan !== "object") continue;
      for (const span of scopeSpan.spans ?? []) {
        events.push(normalizeSpan(span, resourceAttrs, ++globalStep));
      }
    }
  }

  return events;
}

// Validate and throw with a 422-friendly message if the Veil-native payload is malformed.
function validateVeilPayload(p: RawVeilPayload): void {
  if (!p.session_id || typeof p.session_id !== "string" || p.session_id.length > 128) {
    throw Object.assign(new Error("session_id must be a non-empty string (max 128 chars)"), { status: 422 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(p.session_id)) {
    throw Object.assign(new Error("session_id may only contain letters, numbers, hyphens and underscores"), { status: 422 });
  }
  if (!p.type || typeof p.type !== "string") {
    throw Object.assign(new Error("type must be a non-empty string"), { status: 422 });
  }
  if (p.step !== undefined && (!Number.isInteger(p.step) || p.step < 0)) {
    throw Object.assign(new Error("step must be a non-negative integer"), { status: 422 });
  }
  if (p.payload !== undefined) {
    if (typeof p.payload !== "object" || Array.isArray(p.payload) || p.payload === null) {
      throw Object.assign(new Error("payload must be a plain object"), { status: 422 });
    }
    if (JSON.stringify(p.payload).length > 10_240) {
      throw Object.assign(new Error("payload exceeds 10KB limit"), { status: 422 });
    }
  }
  if (p.timestamp !== undefined) {
    const d = new Date(p.timestamp);
    if (isNaN(d.getTime())) {
      throw Object.assign(new Error("timestamp must be a valid ISO 8601 string"), { status: 422 });
    }
    if (d.getTime() > Date.now() + 60 * 60 * 1000) {
      throw Object.assign(new Error("timestamp cannot be more than 1 hour in the future"), { status: 422 });
    }
  }
}

// Map webhook-friendly field names to canonical OpenLIT names so the
// classification engine works without modification.
function applyAliases(p: Record<string, unknown>): Record<string, unknown> {
  const out = { ...p };
  if ("model"     in out && !("gen_ai.request.model"   in out)) out["gen_ai.request.model"]   = out.model;
  if ("input"     in out && !("gen_ai.prompt"          in out)) out["gen_ai.prompt"]           = out.input;
  if ("output"    in out && !("gen_ai.completion"      in out)) out["gen_ai.completion"]       = out.output;
  if ("error"     in out && !("gen_ai.error.message"   in out)) out["gen_ai.error.message"]    = out.error;
  if ("tool_name" in out && !("gen_ai.tool.name"       in out)) out["gen_ai.tool.name"]        = out.tool_name;
  if ("cost"      in out && !("gen_ai.usage.cost"      in out)) out["gen_ai.usage.cost"]       = out.cost;
  if ("prompt_tokens" in out && !("gen_ai.usage.prompt_tokens" in out)) out["gen_ai.usage.prompt_tokens"] = out.prompt_tokens;
  if ("completion_tokens" in out && !("gen_ai.usage.completion_tokens" in out)) out["gen_ai.usage.completion_tokens"] = out.completion_tokens;
  // Convert duration_ms → duration_ns so the latency classifier works
  if ("duration_ms" in out && !("duration_ns" in out)) {
    out["duration_ns"] = Number(out.duration_ms) * 1_000_000;
  }
  return out;
}

// Normalize a single Veil-native event (sent by SDK or webhook clients).
export function normalize(raw: unknown): NormalizedEvent {
  const payload = raw as RawVeilPayload;

  if (payload.session_id && payload.type) {
    validateVeilPayload(payload);
    return {
      sessionId: payload.session_id,
      orgId: payload.org_id ?? "",
      step: payload.step ?? 0,
      type: payload.type,
      payload: applyAliases(payload.payload ?? {}),
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    };
  }

  throw new Error("Cannot normalize payload: use normalizeOtlp() for OTLP spans");
}
