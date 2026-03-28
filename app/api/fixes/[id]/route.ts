import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deleteFix } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { withApiHandler, withTimeout } from "@/lib/api-handler";

export const DELETE = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  await deleteFix(org.id, params.id);
  return NextResponse.json({ ok: true });
});
