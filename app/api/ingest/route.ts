import { NextRequest, NextResponse } from "next/server";
import { normalize } from "@/lib/normalizer";
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

// Returns the next step number for a session (used when client omits step)
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
    logger.warn("[ingest] Request missing api_key");
    return NextResponse.json({ error: "Missing api_key" }, { status: 401 });
  }

  const org = await getOrgByApiKey(apiKey);
  if (!org) {
    logger.warn("[ingest] Invalid api_key", { apiKey: apiKey.slice(0, 10) + "..." });
    return NextResponse.json({ error: "Invalid api_key" }, { status: 401 });
  }

  // Rate limiting — per api_key sliding window (always enforced; Redis upgrades to distributed)
  const { success, limit, remaining, reset } = await checkRateLimit(apiKey);
  if (!success) {
    logger.warn("[ingest] Rate limit exceeded", { orgId: org.id, limit, reset });
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
  } catch (err) {
    logger.exception("[ingest] Failed to parse request body", err, { orgId: org.id });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let event;
  try {
    event = normalize(body);
  } catch (err) {
    logger.exception("[ingest] Failed to normalize payload", err, { orgId: org.id });
    const status = (err as { status?: number }).status === 422 ? 422 : 422;
    return NextResponse.json(
      { error: "Failed to normalize payload", detail: (err as Error).message },
      { status }
    );
  }

  const orgId = org.id;

  try {
    const agentName = String(
      event.payload["gen_ai.system"] ?? event.payload.agent_name ?? "default"
    );

    let agent;
    try {
      agent = await upsertAgent(orgId, agentName);
    } catch (err) {
      logger.exception("[ingest] Failed to upsert agent", err, { orgId, agentName });
      throw err;
    }

    let session = await getSessionById(orgId, event.sessionId);
    if (!session) {
      try {
        session = await createSession(orgId, agent.id, event.sessionId);
        logger.info("[ingest] Created session", { orgId, sessionId: session.id, agentName });
      } catch (err) {
        logger.exception("[ingest] Failed to create session", err, { orgId, sessionId: event.sessionId });
        throw err;
      }
    }

    // Auto-increment step if client sent 0 or omitted it (prevents timeline ordering issues)
    const step = event.step > 0
      ? event.step
      : await getNextStep(orgId, session.id);

    try {
      await insertEvent(orgId, session.id, step, event.type, event.payload, event.timestamp);
    } catch (err) {
      logger.exception("[ingest] Failed to insert event", err, {
        orgId,
        sessionId: session.id,
        step,
        type: event.type,
      });
      throw err;
    }

    // On session end: classify and close the session
    if (event.type === "session.end") {
      logger.info("[ingest] Processing session.end", { orgId, sessionId: session.id });

      let allEvents;
      try {
        allEvents = await getEventsBySession(orgId, session.id);
      } catch (err) {
        logger.exception("[ingest] Failed to fetch events for classification", err, { orgId, sessionId: session.id });
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
        await completeSession(orgId, session.id, {
          status: result ? "failed" : "completed",
          failure_type: result?.category ?? null,
          cost: totalCost,
          duration_ms: Math.round(durationMs),
        });
      } catch (err) {
        logger.exception("[ingest] Failed to complete session", err, { orgId, sessionId: session.id });
        throw err;
      }

      if (result) {
        try {
          await insertClassification(
            session.id,
            result.category,
            result.subcategory,
            result.severity,
            result.reason
          );
          logger.info("[ingest] Classification inserted", {
            orgId,
            sessionId: session.id,
            category: result.category,
            severity: result.severity,
          });
          // Fire-and-forget alerts — never block the ingest response
          void sendFailureAlert({ org, sessionId: session.id, result });
          void sendSlackAlert({ org, sessionId: session.id, result });
        } catch (err) {
          logger.exception("[ingest] Failed to insert classification", err, {
            orgId,
            sessionId: session.id,
            category: result.category,
          });
          throw err;
        }
      } else {
        logger.info("[ingest] Session completed with no failures", { orgId, sessionId: session.id, cost: totalCost, durationMs });
      }
    }

    return NextResponse.json({
      status: "ok",
      session_id: session.id,
      // Explicitly echo back for session.start so webhook clients can confirm
      ...(event.type === "session.start" && { started: true }),
    });
  } catch (err) {
    logger.exception("[ingest] Unhandled error", err, { orgId });
    reportError({
      route: "/api/ingest",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      org_id: orgId,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
