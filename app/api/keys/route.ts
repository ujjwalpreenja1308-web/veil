import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { generateApiKey } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// GET — returns masked key for display (last 4 chars visible)
export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const masked = `vl_${"*".repeat(58)}${org.api_key.slice(-4)}`;
  return NextResponse.json({
    keys: [{ id: org.id, label: "Default", masked, created_at: org.created_at }],
  });
}

// POST — rotate the API key, returns new key in plaintext once
export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await getOrgByClerkUser(userId);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const newKey = generateApiKey();

  const { error } = await supabase
    .from("organizations")
    .update({ api_key: newKey })
    .eq("id", org.id);

  if (error) {
    logger.exception("[keys] Failed to rotate key", error, { orgId: org.id });
    return NextResponse.json({ error: "Failed to rotate key" }, { status: 500 });
  }

  return NextResponse.json({
    key: newKey,
    warning: "Store this key now — it will not be shown again.",
  });
}
