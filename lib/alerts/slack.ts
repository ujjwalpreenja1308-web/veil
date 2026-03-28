// Slack alerts via Composio — fires after a failure is classified
// Always async/fire-and-forget — never blocks the ingest response
import { logger } from "@/lib/logger";
import type { Organization } from "@/lib/db/schema";
import type { ClassificationResult } from "@/lib/rules/engine";

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high:     "🟠",
  medium:   "🟡",
  low:      "🔵",
};

// No # prefix — Composio strips it but docs say don't include it
const SLACK_CHANNEL = "viell-alerts";

export async function sendSlackAlert(params: {
  org: Organization;
  sessionId: string;
  result: ClassificationResult;
}): Promise<void> {
  const { org, sessionId, result } = params;

  const composioApiKey = process.env.COMPOSIO_API_KEY;
  if (!composioApiKey) {
    logger.warn("[alerts/slack] COMPOSIO_API_KEY not set — skipping Slack alert", {
      orgId: org.id,
      sessionId,
      category: result.category,
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://veil.dev";
  const sessionUrl = `${appUrl}/dashboard/sessions/${sessionId}`;
  const emoji = SEVERITY_EMOJI[result.severity] ?? "⚪";
  const category = result.category.replace(/_/g, " ");

  // markdown_text is the preferred field — renders nicely in Slack
  const markdownText = [
    `${emoji} **Veil Alert — ${result.severity.toUpperCase()}**`,
    `**Category:** ${category}`,
    `**Reason:** ${result.reason}`,
    `[View Session →](${sessionUrl})`,
  ].join("\n");

  try {
    const { Composio } = await import("composio-core");
    const client = new Composio({ apiKey: composioApiKey });

    await client.actions.execute({
      actionName: "SLACK_SEND_MESSAGE",
      requestBody: {
        input: {
          channel: SLACK_CHANNEL,
          markdown_text: markdownText,
        },
      },
    });

    logger.info("[alerts/slack] Alert sent", {
      orgId: org.id,
      sessionId,
      category: result.category,
      severity: result.severity,
      channel: SLACK_CHANNEL,
    });
  } catch (err) {
    logger.exception("[alerts/slack] Failed to send Slack alert via Composio", err, {
      orgId: org.id,
      sessionId,
      category: result.category,
    });
  }
}
