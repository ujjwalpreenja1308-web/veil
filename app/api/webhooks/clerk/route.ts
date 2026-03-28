// Clerk webhook — provisions org for every new signup
// PUBLIC route — verified via Svix HMAC signature, NOT Clerk session auth
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { createOrg } from "@/lib/db/queries";
import { generateApiKey } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedEvent {
  type: string;
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string | null;
    public_metadata: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("[webhook/clerk] CLERK_WEBHOOK_SECRET env var is not set — cannot verify webhooks");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // ── Svix signature verification ───────────────────────────────────────────
  const svixId        = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn("[webhook/clerk] Missing Svix headers", {
      hasSvixId: !!svixId,
      hasSvixTimestamp: !!svixTimestamp,
      hasSvixSignature: !!svixSignature,
    });
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  // Must read as raw text — Svix verifies the raw bytes, not parsed JSON
  const rawBody = await req.text();

  const wh = new Webhook(secret);
  let evt: ClerkUserCreatedEvent;

  try {
    evt = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch (err) {
    logger.exception("[webhook/clerk] Svix signature verification failed — possible forgery or replay", err, {
      svixId,
      svixTimestamp,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── Only handle user.created ──────────────────────────────────────────────
  if (evt.type !== "user.created") {
    logger.debug("[webhook/clerk] Ignoring non-user.created event", { type: evt.type });
    return NextResponse.json({ status: "ignored" });
  }

  const {
    id: clerkUserId,
    public_metadata,
    first_name,
    last_name,
    email_addresses,
    primary_email_address_id,
  } = evt.data;

  logger.info("[webhook/clerk] Processing user.created", { clerkUserId });

  // ── Idempotency guard ─────────────────────────────────────────────────────
  if (public_metadata?.org_id) {
    logger.info("[webhook/clerk] User already provisioned, skipping", { clerkUserId, org_id: public_metadata.org_id });
    return NextResponse.json({ status: "already_provisioned" });
  }

  // ── Derive org name ───────────────────────────────────────────────────────
  let orgName: string;
  if (first_name && last_name) {
    orgName = `${first_name} ${last_name}`;
  } else if (first_name) {
    orgName = first_name;
  } else {
    const primaryEmail =
      email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
      email_addresses[0]?.email_address;
    orgName = primaryEmail ? primaryEmail.split("@")[0] : "My Organization";
  }

  // ── Create org in Supabase ────────────────────────────────────────────────
  const apiKey = generateApiKey();
  let org;

  try {
    org = await createOrg(orgName, apiKey, clerkUserId);
    logger.info("[webhook/clerk] Org created in Supabase", { clerkUserId, orgId: org.id, orgName });
  } catch (err) {
    logger.exception("[webhook/clerk] Failed to create org — Clerk will retry", err, { clerkUserId, orgName });
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }

  // ── Write org_id back to Clerk publicMetadata ─────────────────────────────
  try {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { org_id: org.id },
    });
    logger.info("[webhook/clerk] Clerk metadata updated", { clerkUserId, orgId: org.id });
  } catch (err) {
    logger.exception(
      "[webhook/clerk] Failed to write org_id to Clerk metadata — returning 500 so Clerk retries. Org already exists in Supabase (upsert is safe).",
      err,
      { clerkUserId, orgId: org.id }
    );
    return NextResponse.json({ error: "Failed to update user metadata" }, { status: 500 });
  }

  logger.info("[webhook/clerk] Provisioning complete", { clerkUserId, orgId: org.id, orgName });
  return NextResponse.json({ status: "provisioned", org_id: org.id });
}
