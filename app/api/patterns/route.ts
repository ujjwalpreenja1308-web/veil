import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFailurePatterns } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { withApiHandler, withRetry } from "@/lib/api-handler";
import { FAILURE_CATEGORIES } from "@/lib/rules/categories";
import type { FailureCategory } from "@/lib/rules/categories";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const rawDays = req.nextUrl.searchParams.get("days");
  const days = rawDays ? Math.min(90, Math.max(1, parseInt(rawDays, 10) || 7)) : 7;

  const patterns = await withRetry(
    () => getFailurePatterns(orgId, days),
    { label: "getFailurePatterns" }
  );

  return NextResponse.json({
    patterns: patterns.map((p) => ({
      ...p,
      categoryLabel: FAILURE_CATEGORIES[p.category as FailureCategory] ?? p.category,
    })),
  });
});
