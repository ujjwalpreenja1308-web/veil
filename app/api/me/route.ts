// Lightweight provisioning status check — never throws, used to poll after signup
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ provisioned: false, reason: "unauthenticated" });
  }

  try {
    // Look up org directly by clerk_user_id — bypasses Clerk metadata cache
    const { data: org, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (error) {
      logger.exception("[me] Supabase lookup failed", error, { userId });
      return NextResponse.json({ provisioned: false, reason: "error" });
    }

    // If found in DB but Clerk metadata not yet set, backfill it
    if (org) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        if (!user.publicMetadata?.org_id) {
          await clerk.users.updateUserMetadata(userId, {
            publicMetadata: { org_id: org.id },
          });
          logger.info("[me] Backfilled org_id into Clerk publicMetadata", { userId, orgId: org.id });
        }
      } catch (err) {
        // Non-fatal — org found in DB, that's enough
        logger.warn("[me] Could not backfill Clerk metadata", { userId });
      }
    }

    return NextResponse.json({
      provisioned: !!org,
      org_id: org?.id ?? null,
    });
  } catch (err) {
    logger.exception("[me] Failed to check provisioning status", err, { userId });
    return NextResponse.json({ provisioned: false, reason: "error" });
  }
}
