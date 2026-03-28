// Slack alerts via Composio — fires after a failure is classified
// Always async/fire-and-forget — never blocks the ingest response
import { logger } from "@/lib/logger";
import { withRetry, withTimeout } from "@/lib/api-handler";
import { isOpen, recordSuccess, recordFailure } from "@/lib/alerts/circuit-breaker";
import type { Organization } from "@/lib/db/schema";
import type { ClassificationResult } from "@/lib/rules/engine";

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🔴",
  high:     "🟠",
  medium:   "🟡",
  low:      "🔵",
};

const CIRCUIT_KEY = "slack";

// No # prefix — Composio strips it but docs say don't include it
const SLACK_CHANNEL = process.env.SLACK_ALERT_CHANNEL ?? "viell-alerts";

export async function sendSlackAlert(params: {
  org: Organization;
  sessionId: string;
  result: ClassificationResult;
}): Promise<void> {
  const { org, sessionId, result } = params;

  const composioApiKey = process.env.COMPOSIO_API_KEY;
  if (!composioApiKey) {
    logger.warn("[alerts/slack] COMPOSIO_API_KEY not set — Slack alerts disabled", {
      orgId: org.id,
      sessionId,
    });
    return;
  }

  if (isOpen(CIRCUIT_KEY)) {
    logger.warn("[alerts/slack] Circuit breaker open — skipping Slack alert", {
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

  const markdownText = [
    `${emoji} **Veil Alert — ${result.severity.toUpperCase()}**`,
    `**Category:** ${category}`,
    `**Reason:** ${result.reason}`,
    `[View Session →](${sessionUrl})`,
  ].join("\n");

  const entityId = org.id;

  try {
    await withRetry(
      () =>
        withTimeout(
          async () => {
            const { Composio } = await import("composio-core");
            const client = new Composio({ apiKey: composioApiKey });
            const entity = client.getEntity(entityId);
            return entity.execute({
              actionName: "SLACKBOT_SEND_MESSAGE",
              params: { channel: SLACK_CHANNEL, markdown_text: markdownText },
            });
          },
          10_000,
          "Slack alert"
        ),
      { attempts: 3, baseDelayMs: 500, label: "sendSlackAlert" }
    );

    recordSuccess(CIRCUIT_KEY);
    logger.info("[alerts/slack] Alert sent", {
      orgId: org.id,
      sessionId,
      category: result.category,
      severity: result.severity,
      channel: SLACK_CHANNEL,
    });
  } catch (err) {
    recordFailure(CIRCUIT_KEY);
    logger.exception("[alerts/slack] Failed to send Slack alert after retries", err, {
      orgId: org.id,
      sessionId,
      category: result.category,
      entityId,
    });
  }
}
