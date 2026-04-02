import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { withApiHandler } from "@/lib/api-handler";
import { getOrgId } from "@/lib/db/clerk";
import { getInspectorRun } from "@/lib/db/queries";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const run = await getInspectorRun(orgId, params.id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ run });
});
