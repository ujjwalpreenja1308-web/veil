import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFixesByOrg, createFix, getFixImpact } from "@/lib/db/queries";
import { getOrgId } from "@/lib/db/clerk";
import { withApiHandler, withRetry } from "@/lib/api-handler";

export const GET = withApiHandler(async (_req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const fixes = await withRetry(() => getFixesByOrg(orgId), { label: "getFixesByOrg" });

  // Fetch impact for all fixes in parallel
  const impacts = await Promise.all(
    fixes.map((f) => getFixImpact(orgId, f.id).catch(() => null))
  );

  return NextResponse.json({
    fixes: fixes.map((f, i) => ({ ...f, impact: impacts[i] ?? null })),
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let body: { agent_id?: string; category: string; description: string; applied_at?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.category || !body.description?.trim()) {
    return NextResponse.json({ error: "category and description are required" }, { status: 400 });
  }

  const fix = await createFix(orgId, {
    agent_id: body.agent_id,
    category: body.category,
    description: body.description.trim(),
    applied_at: body.applied_at,
    created_by_user_id: userId,
  });

  return NextResponse.json({ fix });
});
