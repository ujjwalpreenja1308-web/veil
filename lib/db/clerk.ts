// Maps Clerk user IDs to organizations via Clerk public metadata
import { clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { withTimeout } from "@/lib/api-handler";
import type { Organization } from "./schema";

export async function getOrgByClerkUser(userId: string): Promise<Organization | null> {
  let orgId: string | undefined;

  try {
    const user = await withTimeout(async () => {
      const clerk = await clerkClient();
      return clerk.users.getUser(userId);
    }, 5_000, "Clerk getUser");
    orgId = user.publicMetadata?.org_id as string | undefined;
  } catch (err) {
    logger.exception("Failed to fetch Clerk user", err, { userId });
    return null;
  }

  if (!orgId) {
    logger.warn("User has no org_id in publicMetadata — not yet provisioned", { userId });
    return null;
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error) {
    logger.exception("Failed to fetch org from Supabase", error, { userId, orgId });
    return null;
  }

  return data as Organization;
}
