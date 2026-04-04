// Zapier integration endpoint
// POST /api/ingest/zapier
//
// In your Zap, use the "Webhooks by Zapier" action → "POST" method.
// URL:  https://<your-domain>/api/ingest/zapier
// Headers:
//   X-API-Key: vl_xxx
//   Content-Type: application/json
//
// Body (JSON payload):
//   {
//     "session_id": "{{run_id}}",
//     "type": "llm.call",
//     "agent_name": "My Zapier Agent",
//     "model": "gpt-4o",
//     "input": "{{prompt_field}}",
//     "output": "{{response_field}}",
//     "status": "success"   ← triggers session.end automatically
//   }
//
// Send an array of objects to ingest multiple events in one request.

import { NextRequest, NextResponse } from "next/server";
import { normalizeZapier } from "@/lib/normalizer/zapier";
import { classify } from "@/lib/rules/engine";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporter";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendFailureAlert } from "@/lib/alerts/email";
import { sendSlackAlert } from "@/lib/alerts/slack";
import {
  getOrgByApiKey,
  upsertAgent,
  createSession,
  completeSession,
  insertEvent,
  insertClassification,
  getEventsBySession,
  getSessionById,
  getSessionEventCount,
} from "@/lib/db/queries";
import { toSessionUuid } from "@/lib/utils";

async function getNextStep(orgId: string, sessionId: string): Promise<number> {
  try {
    return (await getSessionEventCount(orgId, sessionId)) + 1;
  } catch {
    return 1;
  }
}

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("x-api-key") ??
    req.nextUrl.searchParams.get("api_key");

  if (!apiKey) {
    return NextResponse.json({ error: "Missing api_key" }, { status: 401 });
  }

  const org = await getOrgByApiKey(apiKey);
  if (!org) {
    return NextResponse.json({ error: "Invalid api_key" }, { status: 401 });
  }

  const { success, limit, remaining, reset } = await checkRateLimit(apiKey);
  if (!success) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let events;
  try {
    events = normalizeZapier(body);
  } catch (err) {
    logger.exception("[ingest/zapier] Failed to normalize payload", err, { orgId: org.id });
    const status = (err as { status?: number }).status ?? 422;
    return NextResponse.json(
      { error: "Failed to normalize Zapier payload", detail: (err as Error).message },
      { status }
    );
  }

  const orgId = org.id;

  try {
    // Group events by session_id (Zapier arrays can span multiple sessions)
    const bySession = new Map<string, typeof events>();
    for (const event of events) {
      const sid = toSessionUuid(orgId, event.sessionId);
      event.sessionId = sid;
      if (!bySession.has(sid)) bySession.set(sid, []);
      bySession.get(sid)!.push(event);
    }

    const sessionIds: string[] = [];

    for (const [sessionId, sessionEvents] of bySession) {
      const agentName = String(
        sessionEvents[0].payload["agent_name"] ?? "zapier-agent"
      );

      const agent = await upsertAgent(orgId, agentName);

      let session = await getSessionById(orgId, sessionId);
      if (!session) {
        session = await createSession(orgId, agent.id, sessionId);
        logger.info("[ingest/zapier] Created session", { orgId, sessionId, agentName });
      }

      for (const event of sessionEvents) {
        const step = event.step > 0
          ? event.step
          : await getNextStep(orgId, session.id);

        await insertEvent(orgId, session.id, step, event.type, event.payload, event.timestamp);
      }

      const hasSessionEnd = sessionEvents.some((e) => e.type === "session.end");
      if (hasSessionEnd) {
        const allEvents = await getEventsBySession(orgId, session.id);
        const results = classify(allEvents);
        const primaryResult = results[0] ?? null;

        const totalCost = allEvents.reduce(
          (sum, e) => sum + Number(e.payload["gen_ai.usage.cost"] ?? e.payload.cost ?? 0),
          0
        );
        const durationMs = allEvents.reduce(
          (sum, e) => sum + Number(e.payload.duration_ns ?? 0) / 1_000_000,
          0
        );

        await completeSession(orgId, session.id, {
          status: primaryResult ? "failed" : "completed",
          failure_type: primaryResult?.category ?? null,
          cost: totalCost,
          duration_ms: Math.round(durationMs),
        });

        if (results.length > 0) {
          for (const result of results) {
            await insertClassification(
              orgId, session.id,
              result.category, result.subcategory, result.severity, result.reason
            );
          }
          void sendFailureAlert({ org, sessionId: session.id, result: primaryResult! });
          void sendSlackAlert({ org, sessionId: session.id, result: primaryResult! });
        }

        logger.info("[ingest/zapier] Session completed", {
          orgId,
          sessionId: session.id,
          failures: results.length,
        });
      }

      sessionIds.push(session.id);
    }

    return NextResponse.json({
      status: "ok",
      session_ids: sessionIds,
      events_ingested: events.length,
    });
  } catch (err) {
    logger.exception("[ingest/zapier] Unhandled error", err, { orgId });
    reportError({
      route: "/api/ingest/zapier",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      org_id: orgId,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
