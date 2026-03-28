import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionsByOrg } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentSession } from "@/lib/presenter";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const sessions = await getSessionsByOrg(org.id);
  return NextResponse.json({ sessions: sessions.map(presentSession) });
}
