import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentsWithHealth } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const agents = await getAgentsWithHealth(org.id);
  return NextResponse.json({ agents });
}
