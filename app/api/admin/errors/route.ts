import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrgId } from "@/lib/db/clerk";
import { supabase } from "@/lib/supabase";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify user belongs to an org (any authenticated user can see their org's errors)
  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const limit = Math.min(200, parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50);

  const { data, error } = await supabase
    .from("error_logs")
    .select("id, route, message, stack, context, org_id, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return NextResponse.json({ errors: data ?? [] });
});
