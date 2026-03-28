import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionsByOrg } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentSession } from "@/lib/presenter";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export const GET = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const rawLimit = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(rawLimit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  const sessions = await withRetry(() => getSessionsByOrg(org.id, limit), { label: "getSessionsByOrg" });
  return NextResponse.json({ sessions: sessions.map(presentSession), hasMore: sessions.length === limit });
});
