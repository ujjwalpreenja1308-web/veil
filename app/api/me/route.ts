// Lightweight provisioning status check — never throws, used to poll after signup
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrgByClerkUser } from "@/lib/db/clerk";
import { logger } from "@/lib/logger";

export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ provisioned: false, reason: "unauthenticated" });
  }

  try {
    const org = await getOrgByClerkUser(userId);
    return NextResponse.json({
      provisioned: !!org,
      org_id: org?.id ?? null,
    });
  } catch (err) {
    logger.exception("[me] Failed to check provisioning status", err, { userId });
    return NextResponse.json({ provisioned: false, reason: "error" });
  }
}
