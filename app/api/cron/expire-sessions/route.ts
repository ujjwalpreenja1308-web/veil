// Cron job: mark sessions stuck in "running" as timed_out.
// Runs hourly via Vercel cron. Protects against webhook clients that crash
// before sending session.end (n8n/Zapier workflow failures, etc.)
import { NextRequest, NextResponse } from "next/server";
import { expireOrphanedSessions } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/error-reporter";

// Sessions running longer than this are considered orphaned
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

export async function GET(req: NextRequest) {
  // Vercel signs cron requests with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await expireOrphanedSessions(SESSION_TIMEOUT_MS);
    logger.info("[cron/expire-sessions] Expired orphaned sessions", { count: expired });
    return NextResponse.json({ ok: true, expired });
  } catch (err) {
    logger.exception("[cron/expire-sessions] Failed", err, {});
    reportError({
      route: "/api/cron/expire-sessions",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
