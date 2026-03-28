import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionById, getEventsBySession, getClassificationsBySession } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentSession, presentEvent, presentClassification } from "@/lib/presenter";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const session = await getSessionById(org.id, params.id);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const [events, classifications] = await Promise.all([
    getEventsBySession(org.id, session.id),
    getClassificationsBySession(session.id),
  ]);

  return NextResponse.json({
    session: presentSession(session),
    events: events.map(presentEvent),
    classifications: classifications.map(presentClassification),
  });
}
