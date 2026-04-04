// GET /api/integrations/slack — returns current connection status
// POST /api/integrations/slack — initiates OAuth, returns { redirectUrl }
// DELETE /api/integrations/slack — disconnects Slack
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrgId } from "@/lib/db/clerk";
import { logger } from "@/lib/logger";

const SLACK_APP_NAME = "slackbot";

async function getComposioClient() {
  const { Composio } = await import("composio-core");
  return new Composio({ apiKey: process.env.COMPOSIO_API_KEY! });
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json({ connected: false, reason: "Composio not configured" });
  }

  const sendWelcome = req.nextUrl.searchParams.get("welcome") === "1";

  try {
    const client = await getComposioClient();
    const entity = client.getEntity(orgId);
    const connections = await entity.getConnections();
    const slackConn = connections.find(
      (c: { appName?: string; status?: string }) =>
        c.appName?.toLowerCase() === SLACK_APP_NAME && c.status === "ACTIVE"
    );

    // Fire welcome message once after OAuth connect
    if (sendWelcome && slackConn) {
      const channel = process.env.SLACK_ALERT_CHANNEL ?? "veil-alerts";
      void entity.execute({
        actionName: "SLACKBOT_SEND_MESSAGE",
        params: {
          channel,
          markdown_text: `👋 **Veil is now connected!**\nFailure alerts for your AI agents will be posted here. [Open Dashboard →](${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard)`,
        },
      }).catch((e: unknown) => logger.exception("[integrations/slack] Welcome message failed", e, { orgId }));
    }

    return NextResponse.json({
      connected: !!slackConn,
      connectedAccountId: slackConn ? (slackConn as { id?: string }).id : null,
    });
  } catch (err) {
    logger.exception("[integrations/slack] Failed to fetch connection status", err, { orgId });
    return NextResponse.json({ connected: false });
  }
}

export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json({ error: "Composio not configured" }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/dashboard/settings?slack=connected`;

  try {
    const client = await getComposioClient();
    const entity = client.getEntity(orgId);
    const authConfigId = process.env.COMPOSIO_SLACK_AUTH_CONFIG_ID;
    logger.info("[integrations/slack] Initiating connection", { orgId, authConfigId });
    const connReq = await entity.initiateConnection({
      appName: SLACK_APP_NAME,
      redirectUri,
      ...(authConfigId ? { integrationId: authConfigId } : {}),
    });
    logger.info("[integrations/slack] Connection initiated", { redirectUrl: connReq.redirectUrl, status: connReq.connectionStatus });
    return NextResponse.json({ redirectUrl: connReq.redirectUrl });
  } catch (err) {
    logger.exception("[integrations/slack] Failed to initiate connection", err, {
      orgId,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Failed to initiate Slack connection" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getOrgId(userId);
  if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  if (!process.env.COMPOSIO_API_KEY) {
    return NextResponse.json({ error: "Composio not configured" }, { status: 503 });
  }

  try {
    const client = await getComposioClient();
    const entity = client.getEntity(orgId);
    const connections = await entity.getConnections();
    const slackConn = connections.find(
      (c: { appName?: string }) => c.appName?.toLowerCase() === SLACK_APP_NAME
    );
    if (slackConn && (slackConn as { id?: string }).id) {
      await client.connectedAccounts.delete({
        connectedAccountId: (slackConn as { id: string }).id,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.exception("[integrations/slack] Failed to disconnect", err, { orgId });
    return NextResponse.json({ error: "Failed to disconnect Slack" }, { status: 500 });
  }
}
