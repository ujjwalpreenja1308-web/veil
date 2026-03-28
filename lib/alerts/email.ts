// Email alerts via Composio — fires after a failure is classified
// Always async/fire-and-forget — never blocks the ingest response
import { logger } from "@/lib/logger";
import { clerkClient } from "@clerk/nextjs/server";
import type { Organization } from "@/lib/db/schema";
import type { ClassificationResult } from "@/lib/rules/engine";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#3b82f6",
};

function buildEmailHtml(params: {
  sessionId: string;
  result: ClassificationResult;
  appUrl: string;
}): string {
  const { sessionId, result, appUrl } = params;
  const color = SEVERITY_COLOR[result.severity] ?? "#6b7280";
  const sessionUrl = `${appUrl}/dashboard/sessions/${sessionId}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
  <h2 style="margin-top:0">
    <span style="color:#111">Veil</span>
    <span style="color:${color};font-size:14px;font-weight:600;margin-left:8px;text-transform:uppercase">
      ${result.severity} alert
    </span>
  </h2>

  <p style="font-size:15px">
    A <strong>${result.severity}</strong> failure was detected in one of your agents.
  </p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:8px 0;color:#6b7280;width:130px">Category</td>
      <td style="padding:8px 0;font-weight:600">${result.category.replace(/_/g, " ")}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:8px 0;color:#6b7280">Subcategory</td>
      <td style="padding:8px 0">${result.subcategory.replace(/_/g, " ")}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:8px 0;color:#6b7280">Severity</td>
      <td style="padding:8px 0">
        <span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">
          ${result.severity}
        </span>
      </td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:8px 0;color:#6b7280">Reason</td>
      <td style="padding:8px 0">${result.reason}</td>
    </tr>
    <tr>
      <td style="padding:8px 0;color:#6b7280">Time</td>
      <td style="padding:8px 0">${new Date().toISOString()}</td>
    </tr>
  </table>

  <a href="${sessionUrl}"
     style="display:inline-block;background:#111;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;margin-top:8px">
    View Session →
  </a>

  <p style="margin-top:32px;font-size:12px;color:#9ca3af">
    You are receiving this because you are the owner of a Veil organization.
  </p>
</body>
</html>`.trim();
}

export async function sendFailureAlert(params: {
  org: Organization;
  sessionId: string;
  result: ClassificationResult;
}): Promise<void> {
  const { org, sessionId, result } = params;

  const composioApiKey = process.env.COMPOSIO_API_KEY;
  if (!composioApiKey) {
    logger.warn("[alerts/email] COMPOSIO_API_KEY not set — skipping alert", {
      orgId: org.id,
      sessionId,
      category: result.category,
    });
    return;
  }

  // Get user email from Clerk
  let toEmail: string | undefined;
  try {
    if (!org.clerk_user_id) {
      logger.warn("[alerts/email] Org has no clerk_user_id — cannot resolve email", { orgId: org.id });
      return;
    }
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(org.clerk_user_id);
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    toEmail = primary?.emailAddress;
    if (!toEmail) {
      logger.warn("[alerts/email] Could not resolve primary email for user", {
        orgId: org.id,
        clerkUserId: org.clerk_user_id,
      });
      return;
    }
  } catch (err) {
    logger.exception("[alerts/email] Failed to fetch user email from Clerk", err, {
      orgId: org.id,
      clerkUserId: org.clerk_user_id,
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://veil.dev";
  const subject = `[Veil Alert] ${result.category.replace(/_/g, " ")} detected — ${result.severity}`;
  const htmlBody = buildEmailHtml({ sessionId, result, appUrl });

  try {
    // Dynamic import — keeps composio-core out of the critical ingest path bundle
    const { Composio } = await import("composio-core");
    const client = new Composio({ apiKey: composioApiKey });

    await client.actions.execute({
      actionName: "GMAIL_SEND_EMAIL",
      requestBody: {
        input: {
          recipient_email: toEmail,
          subject,
          body: htmlBody,
        },
      },
    });

    logger.info("[alerts/email] Alert sent", {
      orgId: org.id,
      sessionId,
      category: result.category,
      severity: result.severity,
      to: toEmail,
    });
  } catch (err) {
    logger.exception("[alerts/email] Failed to send email via Composio", err, {
      orgId: org.id,
      sessionId,
      category: result.category,
      to: toEmail,
    });
  }
}
