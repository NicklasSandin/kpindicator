import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ADMIN_EMAILS = (process.env.CONTACT_NOTIFICATION_EMAIL ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const SES_ACCESS_KEY_ID = process.env.SES_ACCESS_KEY_ID;
const SES_SECRET_ACCESS_KEY = process.env.SES_SECRET_ACCESS_KEY;
const SES_REGION = process.env.SES_REGION ?? "us-east-1";
const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "KPIndicator <notifications@kpindicator.com>";

const sesClient =
  SES_ACCESS_KEY_ID && SES_SECRET_ACCESS_KEY
    ? new SESv2Client({
        region: SES_REGION,
        credentials: { accessKeyId: SES_ACCESS_KEY_ID, secretAccessKey: SES_SECRET_ACCESS_KEY },
      })
    : null;

/**
 * Emails ADMIN_EMAILS when something needs a human's attention (new contact
 * submission, new paid signup). No-ops without SES_ACCESS_KEY_ID/SES_SECRET_ACCESS_KEY
 * — logs instead, so the caller doesn't need to branch on whether sending is
 * configured yet.
 */
export async function notifyAdmin(subject: string, text: string) {
  if (ADMIN_EMAILS.length === 0) return;

  if (!sesClient) {
    console.log(
      `[notify] ${subject} (would email ${ADMIN_EMAILS.join(", ")} — set SES_ACCESS_KEY_ID/SES_SECRET_ACCESS_KEY to send it)`,
    );
    return;
  }

  try {
    await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: FROM_EMAIL,
        Destination: { ToAddresses: ADMIN_EMAILS },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Text: { Data: text } },
          },
        },
      }),
    );
  } catch (err) {
    console.error(`[notify] Failed to send "${subject}":`, err);
  }
}

export async function sendEmail(to: string, subject: string, text: string) {
  if (!sesClient) {
    console.log(`[email] ${subject} (would email ${to} — configure SES credentials to send it)`);
    return false;
  }

  try {
    await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: FROM_EMAIL,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject },
            Body: { Text: { Data: text } },
          },
        },
      }),
    );
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}
