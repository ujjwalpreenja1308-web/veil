import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteFix } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { withApiHandler } from "@/lib/api-handler";

export const DELETE = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  await deleteFix(orgId, id);
  return NextResponse.json({ ok: true });
});
