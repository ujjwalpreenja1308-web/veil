// Email alerts via Resend — fires after a failure is classified
// Always async/fire-and-forget — never blocks the ingest response
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { clerkClient } from "@clerk/nextjs/server";
import { withRetry, withTimeout } from "@/lib/api-handler";
import { isOpen, recordSuccess, recordFailure } from "@/lib/alerts/circuit-breaker";
import type { Organization } from "@/lib/db/schema";
import type { ClassificationResult } from "@/lib/rules/engine";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#3b82f6",
};

const CIRCUIT_KEY = "email";

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
    <br/>Sent by <a href="${appUrl}" style="color:#9ca3af">Veil</a>.
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

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logger.error("[alerts/email] RESEND_API_KEY not set — email alerts disabled", {
      orgId: org.id,
      sessionId,
    });
    return;
  }

  if (isOpen(CIRCUIT_KEY)) {
    logger.warn("[alerts/email] Circuit breaker open — skipping email alert", {
      orgId: org.id,
      sessionId,
      category: result.category,
    });
    return;
  }

  // Resolve user email from Clerk
  let toEmail: string | undefined;
  try {
    if (!org.clerk_user_id) {
      logger.warn("[alerts/email] Org has no clerk_user_id — cannot resolve email", { orgId: org.id });
      return;
    }
    const user = await withTimeout(async () => {
      const clerk = await clerkClient();
      return clerk.users.getUser(org.clerk_user_id!);
    }, 5_000, "Clerk user lookup");

    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    toEmail = primary?.emailAddress;
    if (!toEmail) {
      logger.warn("[alerts/email] Could not resolve primary email", {
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
  const fromAddress = process.env.RESEND_FROM_ADDRESS ?? "alerts@veil.dev";
  const subject = `[Veil] ${result.category.replace(/_/g, " ")} detected — ${result.severity}`;
  const html = buildEmailHtml({ sessionId, result, appUrl });

  try {
    await withRetry(
      () =>
        withTimeout(
          async () => {
            const resend = new Resend(resendApiKey);
            const { error } = await resend.emails.send({
              from: `Veil Alerts <${fromAddress}>`,
              to: [toEmail!],
              subject,
              html,
            });
            if (error) throw new Error(error.message);
          },
          10_000,
          "Resend email"
        ),
      { attempts: 3, baseDelayMs: 500, label: "sendFailureAlert" }
    );

    recordSuccess(CIRCUIT_KEY);
    logger.info("[alerts/email] Alert sent via Resend", {
      orgId: org.id,
      sessionId,
      category: result.category,
      severity: result.severity,
      to: toEmail.replace(/(?<=.).*(?=@)/, "***"),
    });
  } catch (err) {
    recordFailure(CIRCUIT_KEY);
    logger.exception("[alerts/email] Failed to send email after retries", err, {
      orgId: org.id,
      sessionId,
      category: result.category,
      to: toEmail.replace(/(?<=.).*(?=@)/, "***"),
    });
  }
}
