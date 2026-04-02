import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentById, getSessionsByAgent } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { presentSession } from "@/lib/presenter";
import { withApiHandler, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const [agent, sessions] = await withRetry(
    () => Promise.all([
      getAgentById(orgId, params.id),
      getSessionsByAgent(orgId, params.id),
    ]),
    { label: "getAgentDetail" }
  );

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return NextResponse.json({ agent, sessions: sessions.map(presentSession) });
});
