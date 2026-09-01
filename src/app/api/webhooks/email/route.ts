import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordEmailEvent } from "@/lib/email-ingest";

/**
 * Generic, provider-agnostic ingestion endpoint for outbound email engagement
 * events (opens, clicks, bounces, etc.). SES sending is implemented separately;
 * add a thin signed SES/SNS adapter that translates provider payloads into this
 * normalized shape. See docs/email-campaigns.md.
 *
 * Body shape:
 *   {
 *     type: "sent"|"delivered"|"opened"|"clicked"|"bounced"|"complained"|"unsubscribed"|"failed",
 *     email: "recipient@example.com",
 *     campaignId?: string,      // our EmailCampaign id — improves matching when set
 *     recipientId?: string,     // our EmailRecipient id — exact match, use if you have it
 *     occurredAt?: string,      // ISO timestamp, defaults to now
 *     url?: string,             // for "clicked"
 *     reason?: string,          // for "bounced" / "failed"
 *   }
 *
 * Optionally protected by EMAIL_WEBHOOK_SECRET — if set, requests must send
 * a matching `x-webhook-secret` header. Unset means unauthenticated (fine
 * for local testing, not for a real deployment).
 */

const bodySchema = z.object({
  type: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "complained", "unsubscribed", "failed"]),
  email: z.string().email(),
  campaignId: z.string().optional(),
  recipientId: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  url: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const requiredSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!requiredSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Email webhook is not configured." }, { status: 503 });
  }
  if (requiredSecret && req.headers.get("x-webhook-secret") !== requiredSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { type, email, campaignId, recipientId, occurredAt, url, reason } = parsed.data;

  const result = await recordEmailEvent({
    type,
    email,
    campaignId,
    recipientId,
    occurredAt: occurredAt ? new Date(occurredAt) : undefined,
    url,
    reason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "No matching recipient found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
