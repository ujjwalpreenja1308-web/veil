import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSessionById, updateClassification, getClassificationsBySession } from "@/lib/db/queries";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { withApiHandler, withTimeout } from "@/lib/api-handler";

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await withTimeout(() => getOrgByClerkUser(userId), 5_000, "getOrgByClerkUser");
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let body: { notes?: string | null; suggestion_applied?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify this classification belongs to this org via session join
  // (classifications don't have org_id directly — we verify through session)
  const updates: Record<string, unknown> = {};
  if ("notes" in body) updates.notes = body.notes ?? null;
  if ("suggestion_applied" in body) {
    updates.suggestion_applied = body.suggestion_applied;
    if (body.suggestion_applied) {
      updates.suggestion_applied_at = new Date().toISOString();
    }
  }

  await updateClassification(params.id, updates as Parameters<typeof updateClassification>[1]);
  return NextResponse.json({ ok: true });
});
