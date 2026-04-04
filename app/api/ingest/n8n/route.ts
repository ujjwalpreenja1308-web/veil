// n8n integration endpoint
// POST /api/ingest/n8n
//
// Configure your n8n "HTTP Request" or "Webhook" node to POST to:
//   https://<your-domain>/api/ingest/n8n
// with header:  X-API-Key: vl_xxx
// and body:     Send execution data (enable "Include Execution Data" in the Webhook node)

import { NextRequest, NextResponse } from "next/server";
import { normalizeN8n } from "@/lib/normalizer/n8n";
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
    events = normalizeN8n(body);
  } catch (err) {
    logger.exception("[ingest/n8n] Failed to normalize payload", err, { orgId: org.id });
    const status = (err as { status?: number }).status ?? 422;
    return NextResponse.json(
      { error: "Failed to normalize n8n payload", detail: (err as Error).message },
      { status }
    );
  }

  const orgId = org.id;

  try {
    // All events in one n8n execution share the same sessionId
    const rawSessionId = events[0].sessionId;
    const sessionId = toSessionUuid(orgId, rawSessionId);

    const agentName = String(
      events[0].payload["agent_name"] ??
      events[0].payload["n8n.workflow.id"] ??
      "n8n-workflow"
    );

    const agent = await upsertAgent(orgId, agentName);

    let session = await getSessionById(orgId, sessionId);
    if (!session) {
      session = await createSession(orgId, agent.id, sessionId);
      logger.info("[ingest/n8n] Created session", { orgId, sessionId, agentName });
    }

    for (const event of events) {
      const step = event.step > 0
        ? event.step
        : await getNextStep(orgId, session.id);

      await insertEvent(orgId, session.id, step, event.type, event.payload, event.timestamp);
    }

    // Process session.end (always the last event from normalizeN8n)
    const hasSessionEnd = events.some((e) => e.type === "session.end");
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

      logger.info("[ingest/n8n] Session completed", {
        orgId,
        sessionId: session.id,
        failures: results.length,
      });
    }

    return NextResponse.json({
      status: "ok",
      session_id: session.id,
      events_ingested: events.length,
    });
  } catch (err) {
    logger.exception("[ingest/n8n] Unhandled error", err, { orgId });
    reportError({
      route: "/api/ingest/n8n",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      org_id: orgId,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
