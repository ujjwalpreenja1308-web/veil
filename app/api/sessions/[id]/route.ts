import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionById, getEventsBySession, getClassificationsBySession, getAgentById } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentSession, presentEvent, presentClassification, shouldShowEvent } from "@/lib/presenter";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const session = await withRetry(
    () => getSessionById(org.id, params.id),
    { label: "getSessionById" }
  );
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const [events, classifications, agent] = await withRetry(
    () => Promise.all([
      getEventsBySession(org.id, session.id),
      getClassificationsBySession(session.id),
      getAgentById(org.id, session.agent_id),
    ]),
    { label: "getSessionDetail" }
  );

  return NextResponse.json({
    session: presentSession({ ...session, agent }),
    events: events.filter((e) => shouldShowEvent(e.type)).map(presentEvent),
    classifications: classifications.map(presentClassification),
  });
});
