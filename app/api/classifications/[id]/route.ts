import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateClassification } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { withApiHandler } from "@/lib/api-handler";

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: classificationId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let body: { notes?: string | null; suggestion_applied?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if ("notes" in body && body.notes !== null) {
    if (typeof body.notes !== "string") {
      return NextResponse.json({ error: "notes must be a string" }, { status: 400 });
    }
    if (body.notes.length > 5000) {
      return NextResponse.json({ error: "notes must be 5000 characters or fewer" }, { status: 400 });
    }
  }
  if ("suggestion_applied" in body && typeof body.suggestion_applied !== "boolean") {
    return NextResponse.json({ error: "suggestion_applied must be a boolean" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if ("notes" in body) updates.notes = body.notes ?? null;
  if ("suggestion_applied" in body) {
    updates.suggestion_applied = body.suggestion_applied;
    if (body.suggestion_applied) {
      updates.suggestion_applied_at = new Date().toISOString();
    }
  }

  // org_id is passed to updateClassification — the query filters by both org_id and id,
  // so a user from a different org cannot update this classification even if they know the UUID.
  await updateClassification(orgId, classificationId, updates as Parameters<typeof updateClassification>[2]);
  return NextResponse.json({ ok: true });
});
