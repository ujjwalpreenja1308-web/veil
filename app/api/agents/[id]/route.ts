import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentById, getSessionsByAgent } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentSession } from "@/lib/presenter";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const agent = await getAgentById(org.id, params.id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const sessions = await getSessionsByAgent(org.id, agent.id);
  return NextResponse.json({ agent, sessions: sessions.map(presentSession) });
}
