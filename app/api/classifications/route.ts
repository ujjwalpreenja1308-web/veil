import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getClassificationsByOrg } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { presentClassification } from "@/lib/presenter";
import { withApiHandler, withTimeout, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const classifications = await withRetry(
    () => getClassificationsByOrg(org.id),
    { label: "getClassificationsByOrg" }
  );

  return NextResponse.json({
    classifications: classifications.map((c) => ({
      ...presentClassification(c),
      session: c.session
        ? { id: c.session.id, startedAt: String(c.session.started_at) }
        : undefined,
    })),
  });
});
