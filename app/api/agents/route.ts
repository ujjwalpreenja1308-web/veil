import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentsWithHealth } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const agents = await withRetry(() => getAgentsWithHealth(org.id), { label: "getAgentsWithHealth" });
  return NextResponse.json({ agents });
});
