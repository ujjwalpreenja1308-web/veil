import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentsWithHealth } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { withApiHandler, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const agents = await withRetry(() => getAgentsWithHealth(orgId), { label: "getAgentsWithHealth" });
  return NextResponse.json({ agents });
});
