import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentById, getSessionsByAgent } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentSession } from "@/lib/presenter";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const [agent, sessions] = await withRetry(
    () => Promise.all([
      getAgentById(org.id, params.id),
      getSessionsByAgent(org.id, params.id),
    ]),
    { label: "getAgentDetail" }
  );

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json({ agent, sessions: sessions.map(presentSession) });
});
