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

  const runs = await getInspectorRunsByOrg(orgId, { agentId });
  return NextResponse.json({ runs });
});
