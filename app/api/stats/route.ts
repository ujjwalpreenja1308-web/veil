import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOverviewStats, getCostByDay } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const [stats, costByDay] = await Promise.all([
    getOverviewStats(org.id),
    getCostByDay(org.id, days),
  ]);

  return NextResponse.json({ ...stats, costByDay });
}
