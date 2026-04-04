import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getOrgId } from "@/lib/db/clerk";
import { createInspectorRun } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { serverEnv } from "@/lib/env";

const INSPECTOR_SERVICE_URL = serverEnv.INSPECTOR_SERVICE_URL;
const INSPECTOR_API_KEY = serverEnv.INSPECTOR_API_KEY;

export const POST = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let body: { agent_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const agentId: string = body?.agent_id ?? "";
  if (!agentId) return NextResponse.json({ error: "agent_id is required" }, { status: 400 });

  if (!INSPECTOR_SERVICE_URL || !INSPECTOR_API_KEY) {
    return NextResponse.json({ error: "Inspector service not configured" }, { status: 503 });
  }

  // Create pending run row immediately
  const run = await createInspectorRun({
    org_id: orgId,
    agent_id: agentId,
    triggered_by: userId,
  });

  // Fire-and-forget: call FastAPI. FastAPI writes results to DB directly.
  void callInspectorService(run.id, orgId, agentId);

  return NextResponse.json({ run }, { status: 202 });
});

async function callInspectorService(runId: string, orgId: string, agentId: string) {
  try {
    await fetch(`${INSPECTOR_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INSPECTOR_API_KEY}`,
      },
      body: JSON.stringify({ run_id: runId, org_id: orgId, agent_id: agentId }),
      signal: AbortSignal.timeout(180_000), // 3 min max
    });
  } catch (err) {
    logger.error("[inspector] Failed to call inspector service", {
      runId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
