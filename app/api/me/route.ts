// Provisioning status check — provisions org on first load if webhook hasn't fired yet.
// Never throws, used to poll after signup.
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { createOrg } from "@/lib/db/queries";
import { generateApiKey } from "@/lib/utils";
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

    if (org) {
      // Backfill Clerk metadata if missing (e.g. provisioned via webhook but metadata write failed)
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        if (!user.publicMetadata?.org_id) {
          await clerk.users.updateUserMetadata(userId, {
            publicMetadata: { org_id: org.id },
          });
          logger.info("[me] Backfilled org_id into Clerk publicMetadata", { userId, orgId: org.id });
        }
      } catch {
        // Non-fatal — org found in DB, that's enough
      }
      return NextResponse.json({ provisioned: true, org_id: org.id });
    }

    // No org found — webhook hasn't fired yet (or domain not set up).
    // Provision on-demand so the dashboard never spins forever.
    logger.info("[me] No org found, provisioning on-demand", { userId });

    let orgName = "My Organization";
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
      const email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      if (user.firstName && user.lastName) {
        orgName = `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        orgName = user.firstName;
      } else if (email) {
        orgName = email.split("@")[0];
      }
    } catch {
      // Non-fatal — fall back to default name
    }

    const apiKey = generateApiKey();
    const newOrg = await createOrg(orgName, apiKey, userId);
    logger.info("[me] On-demand org provisioning complete", { userId, orgId: newOrg.id, orgName });

    // Write org_id back to Clerk metadata (best-effort)
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { org_id: newOrg.id },
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({ provisioned: true, org_id: newOrg.id });
  } catch (err) {
    logger.exception("[me] Failed to check/provision", err, { userId });
    return NextResponse.json({ provisioned: false, reason: "error" });
  }
}
