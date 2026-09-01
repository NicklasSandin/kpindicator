import { createHmac, timingSafeEqual } from "node:crypto";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const accessKeyId = process.env.SES_ACCESS_KEY_ID;
const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
const region = process.env.SES_REGION ?? "us-east-1";

const client = accessKeyId && secretAccessKey
  ? new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey } })
  : null;

export function campaignEmailConfigured() {
  return Boolean(client && process.env.SES_FROM_EMAIL && process.env.EMAIL_PHYSICAL_ADDRESS);
}

function unsubscribeSecret() {
  const configured = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.EMAIL_WEBHOOK_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  return "kpindicator-local-unsubscribe-only";
}

export function createUnsubscribeToken(recipientId: string) {
  const secret = unsubscribeSecret();
  if (!secret) throw new Error("EMAIL_UNSUBSCRIBE_SECRET is required in production.");
  const signature = createHmac("sha256", secret).update(recipientId).digest("base64url");
  return `${Buffer.from(recipientId).toString("base64url")}.${signature}`;
}

export function verifyUnsubscribeToken(token: string) {
  const secret = unsubscribeSecret();
  if (!secret) return null;
  const [encodedId, provided] = token.split(".");
  if (!encodedId || !provided) return null;
  const recipientId = Buffer.from(encodedId, "base64url").toString("utf8");
  const expected = createHmac("sha256", secret).update(recipientId).digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? recipientId : null;
}

export async function sendCampaignEmail({
  to,
  subject,
  text,
  fromEmail,
}: {
  to: string;
  subject: string;
  text: string;
  fromEmail?: string | null;
}) {
  if (!client || !campaignEmailConfigured()) {
    return { ok: false as const, error: "SES campaign sending is not configured." };
  }

  try {
    const result = await client.send(new SendEmailCommand({
      FromEmailAddress: fromEmail || process.env.SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text } } } },
      ConfigurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
    }));
    return { ok: true as const, externalId: result.MessageId };
  } catch (error) {
    console.error("[campaign-email] SES send failed", error);
    return { ok: false as const, error: "SES rejected the message." };
  }
}
