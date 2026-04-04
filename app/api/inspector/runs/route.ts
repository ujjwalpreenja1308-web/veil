import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getOrgId } from "@/lib/db/clerk";
import { getInspectorRunsByOrg } from "@/lib/db/queries";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const agentId = req.nextUrl.searchParams.get("agent_id") ?? undefined;
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10) || 0, 0);

  // Fetch one extra to determine if more pages exist
  const rows = await getInspectorRunsByOrg(orgId, { agentId, limit: limit + 1, offset });
  const hasMore = rows.length > limit;
  const runs = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({ runs, hasMore });
});
