import { NextRequest, NextResponse } from "next/server";

import { recordEmailEvent } from "@/lib/email-ingest";
import { sesEventToNormalized } from "@/lib/ses-events";
import { isAwsSigningUrl, verifySnsSignature, type SnsEnvelope } from "@/lib/sns-signature";

/**
 * Receives SES engagement events published to an SNS topic.
 *
 * Point the configuration set's SNS destination at this URL. SNS cannot send
 * custom headers, so this endpoint authenticates by verifying the message
 * signature rather than by shared secret like /api/webhooks/email does.
 *
 * That check is load-bearing, not hardening: this endpoint writes to the
 * suppression list, so an unverified one would let anyone permanently block any
 * address from receiving our mail by posting a fake complaint.
 *
 * Every rejection logs its reason. A bare 403 in an access log is impossible to
 * diagnose — the difference between a wrong topic ARN and a real signature
 * failure is the difference between a config typo and a broken deploy.
 */

/** Certificates are stable; re-fetching per message would be wasteful. */
const certificateCache = new Map<string, string>();

async function fetchCertificate(url: string): Promise<string | null> {
  const cached = certificateCache.get(url);
  if (cached) return cached;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const certificate = await response.text();
    certificateCache.set(url, certificate);
    return certificate;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  let envelope: SnsEnvelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    console.warn("[ses-webhook] rejected: body was not JSON");
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Pin to our own topic when configured, so a validly signed message from any
  // other SNS topic in any AWS account cannot write to our suppression list.
  const expectedTopic = process.env.SES_SNS_TOPIC_ARN;
  if (expectedTopic && envelope.TopicArn !== expectedTopic) {
    console.warn(
      `[ses-webhook] rejected: topic mismatch. expected=${expectedTopic} received=${envelope.TopicArn ?? "none"}`,
    );
    return NextResponse.json({ error: "Unexpected topic." }, { status: 403 });
  }

  const verified = await verifySnsSignature(envelope, fetchCertificate);
  if (!verified.ok) {
    console.warn(`[ses-webhook] rejected: ${verified.reason} (type=${envelope.Type ?? "none"})`);
    return NextResponse.json({ error: "Invalid signature.", reason: verified.reason }, { status: 403 });
  }

  if (envelope.Type === "SubscriptionConfirmation") {
    // The confirmation URL is an SNS endpoint too, so it gets the same host
    // check — a signed message must not be able to make us fetch anywhere.
    if (!envelope.SubscribeURL || !isAwsSigningUrl(envelope.SubscribeURL)) {
      console.warn("[ses-webhook] confirmation had an unusable SubscribeURL");
      return NextResponse.json({ error: "Unusable SubscribeURL." }, { status: 400 });
    }

    const confirmation = await fetch(envelope.SubscribeURL).catch(() => null);
    console.info(`[ses-webhook] subscription confirmed (status=${confirmation?.status ?? "unreachable"})`);
    return NextResponse.json({ confirmed: confirmation?.ok ?? false });
  }

  if (envelope.Type !== "Notification") {
    return NextResponse.json({ received: true, ignored: envelope.Type ?? "unknown" });
  }

  let sesEvent: unknown;
  try {
    sesEvent = JSON.parse(envelope.Message ?? "");
  } catch {
    console.warn("[ses-webhook] notification carried no readable SES event");
    return NextResponse.json({ error: "Notification carried no readable SES event." }, { status: 400 });
  }

  const events = sesEventToNormalized(sesEvent);
  let recorded = 0;
  let unmatched = 0;

  for (const event of events) {
    const result = await recordEmailEvent(event);
    if (result.ok) recorded += 1;
    else unmatched += 1;
  }

  // Always 200 once verified. A 4xx makes SNS retry for hours, and an event for
  // a recipient we never stored is not a failure worth retrying.
  return NextResponse.json({ received: true, recorded, unmatched });
}
