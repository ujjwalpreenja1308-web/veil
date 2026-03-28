import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOverviewStats, getCostByDay } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  // Validate days: must be a positive integer between 1–365
  const rawDays = req.nextUrl.searchParams.get("days");
  const days = rawDays ? parseInt(rawDays, 10) : 30;
  const safeDays = Number.isInteger(days) && days > 0 && days <= 365 ? days : 30;

  const [stats, costByDay] = await withRetry(
    () => Promise.all([getOverviewStats(org.id), getCostByDay(org.id, safeDays)]),
    { label: "getStats" }
  );

  return NextResponse.json({ ...stats, costByDay });
});
