import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionById, getEventsBySession, getClassificationsBySession, getAgentById } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { presentSession, presentEvent, presentClassification, shouldShowEvent } from "@/lib/presenter";
import { withApiHandler, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const session = await withRetry(
    () => getSessionById(orgId, id),
    { label: "getSessionById" }
  );
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const [events, classifications, agent] = await withRetry(
    () => Promise.all([
      getEventsBySession(orgId, session.id),
      getClassificationsBySession(orgId, session.id),
      getAgentById(orgId, session.agent_id),
    ]),
    { label: "getSessionDetail" }
  );

  return NextResponse.json({
    session: presentSession({ ...session, agent }),
    events: events.filter((e) => shouldShowEvent(e.type)).map(presentEvent),
    classifications: classifications.map(presentClassification),
  });
});
