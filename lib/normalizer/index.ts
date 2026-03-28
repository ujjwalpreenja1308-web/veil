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

// Normalize a single OTLP span into a NormalizedEvent.
// session_id is conveyed via the resource attribute "service.name"
// (which OpenLIT sets from application_name) or span attribute "session.id".
function normalizeSpan(span: RawSpan, resourceAttrs: RawAttr[] | undefined, step: number): NormalizedEvent {
  const spanAttrs = span.attributes;

  // Session ID: prefer span-level, fall back to resource service.name (set by veil SDK to session UUID)
  const sessionId = String(
    extractAttr(spanAttrs, "session.id") ??
    extractAttr(spanAttrs, "gen_ai.session.id") ??
    extractAttr(resourceAttrs, "service.name") ??
    span.traceId ??
    ""
  );

  const type = String(
    span.name ??
    extractAttr(spanAttrs, "gen_ai.operation.name") ??
    "span"
  );

  const flatPayload = flattenAttrs(spanAttrs);

  // Compute duration from span timestamps
  if (span.startTimeUnixNano) {
    flatPayload.duration_ns =
      Number(span.endTimeUnixNano ?? 0) - Number(span.startTimeUnixNano);
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
  const body = raw as RawOtlpPayload;
  const events: NormalizedEvent[] = [];
  let globalStep = 0;

  for (const resourceSpan of body.resourceSpans ?? []) {
    const resourceAttrs = resourceSpan.resource?.attributes;
    for (const scopeSpan of resourceSpan.scopeSpans ?? []) {
      for (const span of scopeSpan.spans ?? []) {
        events.push(normalizeSpan(span, resourceAttrs, ++globalStep));
      }
    }
  }

  return events;
}

// Normalize a single Veil-native event (sent by SDK session.end handler).
export function normalize(raw: unknown): NormalizedEvent {
  const payload = raw as RawVeilPayload;

  if (payload.session_id && payload.type) {
    return {
      sessionId: payload.session_id,
      orgId: payload.org_id ?? "",
      step: payload.step ?? 0,
      type: payload.type,
      payload: payload.payload ?? {},
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    };
  }

  throw new Error("Cannot normalize payload: use normalizeOtlp() for OTLP spans");
}
