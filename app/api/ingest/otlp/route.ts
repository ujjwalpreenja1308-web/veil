// OTLP HTTP ingest — receives spans from OpenLIT via the Veil SDK
// Public endpoint — authenticated via x-api-key header
import { NextRequest, NextResponse } from "next/server";
import { normalizeOtlp } from "@/lib/normalizer";
import { classify } from "@/lib/rules/engine";
import { logger } from "@/lib/logger";
import { ratelimit } from "@/lib/ratelimit";
import { sendFailureAlert } from "@/lib/alerts/email";
import type { Organization } from "@/lib/db/schema";
import {
  getOrgByApiKey,
  upsertAgent,
  createSession,
  completeSession,
  insertEvent,
  insertClassification,
  getEventsBySession,
  getSessionById,
} from "@/lib/db/queries";

export async function POST(req: NextRequest) {
  // Auth: x-api-key header, ?api_key= param, or OTLP header format
  const apiKey = req.headers.get("x-api-key") ?? req.nextUrl.searchParams.get("api_key");
  const otlpHeaders = req.headers.get("otlp-headers") ?? "";
  const otlpApiKey = otlpHeaders.match(/x-api-key=([^\s,]+)/)?.[1];
  const effectiveKey = apiKey ?? otlpApiKey;

  if (!effectiveKey) {
    logger.warn("[ingest/otlp] Request missing api_key");
    return NextResponse.json({ error: "Missing api_key" }, { status: 401 });
  }

  const org = await getOrgByApiKey(effectiveKey);
  if (!org) {
    logger.warn("[ingest/otlp] Invalid api_key", { key: effectiveKey.slice(0, 10) + "..." });
    return NextResponse.json({ error: "Invalid api_key" }, { status: 401 });
  }

  // Rate limiting — per api_key sliding window (fail open when Redis not configured)
  if (ratelimit) {
    const { success, limit, remaining, reset } = await ratelimit.limit(effectiveKey);
    if (!success) {
      logger.warn("[ingest/otlp] Rate limit exceeded", { orgId: org.id, limit, reset });
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        }
      );
    }
  }

  const orgId = org.id;

  const contentType = req.headers.get("content-type") ?? "";
  const pathname = req.nextUrl.pathname;

  let body: unknown;
  try {
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // Protobuf binary — decode using internal OTLP proto definitions
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const root = require("@opentelemetry/otlp-transformer/build/src/generated/root");
      const buf = new Uint8Array(await req.arrayBuffer());
      if (pathname.includes("/logs")) {
        const decoded = root.opentelemetry.proto.collector.logs.v1.ExportLogsServiceRequest.decode(buf);
        body = decoded.toJSON();
      } else {
        const decoded = root.opentelemetry.proto.collector.trace.v1.ExportTraceServiceRequest.decode(buf);
        body = decoded.toJSON();
      }
    }
  } catch (err) {
    logger.exception("[ingest/otlp] Failed to parse request body", err, { orgId, contentType });
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let events;
  try {
    events = normalizeOtlp(body);
  } catch (err) {
    logger.exception("[ingest/otlp] Failed to normalize OTLP payload", err, { orgId });
    return NextResponse.json(
      { error: "Failed to normalize OTLP payload", detail: String(err) },
      { status: 422 }
    );
  }

  if (!events.length) {
    logger.debug("[ingest/otlp] Empty payload received", { orgId });
    return NextResponse.json({ status: "ok", received: 0 });
  }

  logger.info("[ingest/otlp] Received spans", { orgId, count: events.length });

  try {
    // Group events by session_id
    const bySession = new Map<string, typeof events>();
    for (const event of events) {
      const sid = event.sessionId || "default";
      if (!bySession.has(sid)) bySession.set(sid, []);
      bySession.get(sid)!.push(event);
    }

    for (const [sessionId, sessionEvents] of Array.from(bySession.entries())) {
      const agentName = String(
        sessionEvents[0]?.payload["gen_ai.system"] ??
        sessionEvents[0]?.payload.agent_name ??
        "default"
      );

      let agent;
      try {
        agent = await upsertAgent(orgId, agentName);
      } catch (err) {
        logger.exception("[ingest/otlp] Failed to upsert agent", err, { orgId, agentName });
        throw err;
      }

      let session = await getSessionById(orgId, sessionId);
      if (!session) {
        try {
          session = await createSession(orgId, agent.id, sessionId);
          logger.info("[ingest/otlp] Created session", { orgId, sessionId: session.id, agentName });
        } catch (err) {
          logger.exception("[ingest/otlp] Failed to create session", err, { orgId, sessionId });
          throw err;
        }
      }

      // Insert each span as an event
      let inserted = 0;
      let skipped = 0;
      for (const event of sessionEvents) {
        try {
          await insertEvent(orgId, session.id, event.step, event.type, event.payload, event.timestamp);
          inserted++;
        } catch (err) {
          // Duplicate step constraint — expected for retries, log at debug
          logger.debug("[ingest/otlp] Skipping duplicate event step", {
            orgId,
            sessionId: session.id,
            step: event.step,
            type: event.type,
            error: err instanceof Error ? err.message : String(err),
          });
          skipped++;
        }
      }

      if (inserted > 0) {
        logger.info("[ingest/otlp] Events inserted", { orgId, sessionId: session.id, inserted, skipped });
      }

      // Detect session.end span — OpenLIT names it based on the operation
      // The SDK also sends an explicit session.end via the native ingest route,
      // but we handle it here too for robustness
      const hasSessionEnd = sessionEvents.some((e) =>
        e.type === "session.end" ||
        e.type.toLowerCase().includes("session.end")
      );

      if (hasSessionEnd) {
        logger.info("[ingest/otlp] Processing session end", { orgId, sessionId: session.id });
        await closeSession(org, session.id);
      }
    }

    return NextResponse.json({ status: "ok", received: events.length });
  } catch (err) {
    logger.exception("[ingest/otlp] Unhandled error", err, { orgId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Shared session close logic — fetch all events, classify, persist result
async function closeSession(org: Organization, sessionId: string): Promise<void> {
  const orgId = org.id;
  let allEvents;
  try {
    allEvents = await getEventsBySession(orgId, sessionId);
  } catch (err) {
    logger.exception("[ingest/otlp] Failed to fetch events for classification", err, { orgId, sessionId });
    throw err;
  }

  const result = classify(allEvents);

  const totalCost = allEvents.reduce(
    (sum, e) => sum + Number(e.payload["gen_ai.usage.cost"] ?? e.payload.cost ?? 0),
    0
  );
  const durationMs = allEvents.reduce(
    (sum, e) => sum + Number(e.payload.duration_ns ?? 0) / 1_000_000,
    0
  );

  try {
    await completeSession(orgId, sessionId, {
      status: result ? "failed" : "completed",
      failure_type: result?.category ?? null,
      cost: totalCost,
      duration_ms: Math.round(durationMs),
    });
    logger.info("[ingest/otlp] Session closed", {
      orgId,
      sessionId,
      status: result ? "failed" : "completed",
      cost: totalCost,
      durationMs: Math.round(durationMs),
    });
  } catch (err) {
    logger.exception("[ingest/otlp] Failed to complete session", err, { orgId, sessionId });
    throw err;
  }

  if (result) {
    try {
      await insertClassification(
        sessionId,
        result.category,
        result.subcategory,
        result.severity,
        result.reason
      );
      logger.info("[ingest/otlp] Classification inserted", {
        orgId,
        sessionId,
        category: result.category,
        severity: result.severity,
        reason: result.reason,
      });
      // Fire-and-forget alert — never block the ingest response
      void sendFailureAlert({ org, sessionId, result });
    } catch (err) {
      logger.exception("[ingest/otlp] Failed to insert classification", err, { orgId, sessionId });
      throw err;
    }
  }
}
