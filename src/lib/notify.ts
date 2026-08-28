const ADMIN_EMAILS = (process.env.CONTACT_NOTIFICATION_EMAIL ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "KPIndicator <notifications@kpindicator.co>";

/**
 * Emails ADMIN_EMAILS when something needs a human's attention (new contact
 * submission, new paid signup). No-ops without RESEND_API_KEY — logs instead,
 * so the caller doesn't need to branch on whether sending is configured yet.
 */
export async function notifyAdmin(subject: string, text: string) {
  if (ADMIN_EMAILS.length === 0) return;

  if (!RESEND_KEY) {
    console.log(`[notify] ${subject} (would email ${ADMIN_EMAILS.join(", ")} — set RESEND_API_KEY to send it)`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: ADMIN_EMAILS, subject, text }),
  });

  if (!res.ok) {
    console.error(`[notify] Failed to send "${subject}": ${res.status} ${await res.text()}`);
  }
}
