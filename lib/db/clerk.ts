// Maps Clerk user IDs to organizations.
// Reads org_id from the JWT session claims (publicMetadata) — no Clerk API call needed.
// Falls back to a direct Supabase lookup only if the claim is missing.
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import type { Organization } from "./schema";

/**
 * Fast path — returns org_id directly from the JWT with zero network calls.
 * Use this in routes that only need org_id to scope DB queries.
 * Falls back to Supabase lookup if the claim is absent (e.g. token not yet refreshed).
 */
export async function getOrgId(userId: string): Promise<string | null> {
  const { sessionClaims } = await auth();
  // Clerk puts publicMetadata into sessionClaims — check both top-level and nested
  const claims = sessionClaims as Record<string, unknown> | null | undefined;
  const meta = (claims?.publicMetadata ?? claims?.metadata) as Record<string, unknown> | undefined;
  const orgId = (claims?.org_id ?? meta?.org_id) as string | undefined;
  if (orgId) return orgId;

  // Fallback: look up by clerk_user_id in Supabase
  logger.warn("org_id not in JWT claims, falling back to Supabase lookup", { userId });
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();
  return data?.id ?? null;
}

export async function getOrgByClerkUser(userId: string): Promise<Organization | null> {
  // Fast path: org_id is embedded in the JWT via Clerk publicMetadata — no network call
  const { sessionClaims } = await auth();
  const claims = sessionClaims as Record<string, unknown> | null | undefined;
  const meta = (claims?.publicMetadata ?? claims?.metadata) as Record<string, unknown> | undefined;
  const orgId = (claims?.org_id ?? meta?.org_id) as string | undefined;

  if (orgId) {
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

  // Slow path: claim missing — look up by clerk_user_id directly in Supabase
  logger.warn("org_id not in JWT claims, falling back to Supabase lookup", { userId });
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (error) {
    logger.exception("Failed to fetch org by clerk_user_id", error, { userId });
    return null;
  }
  return data as Organization;
}
