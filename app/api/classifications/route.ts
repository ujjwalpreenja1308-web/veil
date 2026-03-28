import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClassificationsByOrg } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentClassification } from "@/lib/presenter";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

export const GET = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const rawLimit = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  const classifications = await withRetry(
    () => getClassificationsByOrg(org.id, limit),
    { label: "getClassificationsByOrg" }
  );

  return NextResponse.json({
    classifications: classifications.map((c) => ({
      ...presentClassification(c),
      session: c.session
        ? { id: c.session.id, startedAt: String(c.session.started_at) }
        : undefined,
    })),
    hasMore: classifications.length === limit,
  });
});
