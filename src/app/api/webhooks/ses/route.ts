import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { recordEmailEvent } from "@/lib/email-ingest";
import { sesEventToNormalized } from "@/lib/ses-events";

/**
 * Receives SES engagement events published to an SNS topic.
 *
 * Point the configuration set's SNS destination at this URL. SNS cannot send
 * custom headers, which is why this endpoint authenticates by verifying the
 * message signature rather than by shared secret like /api/webhooks/email does.
 *
 * The signature check is not optional hardening. This endpoint writes to the
 * suppression list, so an unverified one lets anyone permanently block any
 * address from ever receiving mail from us by posting a fake complaint.
 */

/** Certificates are stable and re-fetched per message otherwise. */
const certificateCache = new Map<string, string>();

type SnsEnvelope = {
  Type?: string;
  MessageId?: string;
  TopicArn?: string;
  Subject?: string;
  Message?: string;
  Timestamp?: string;
  Token?: string;
  SubscribeURL?: string;
  Signature?: string;
  SignatureVersion?: string;
  SigningCertURL?: string;
};

/** The exact fields, in the exact order, that SNS signs for each message type. */
const SIGNED_FIELDS: Record<string, string[]> = {
  Notification: ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"],
  SubscriptionConfirmation: ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"],
  UnsubscribeConfirmation: ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"],
};

function isAwsCertificateUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    // Both checks matter: https alone would allow an attacker's host, and a
    // hostname check alone would allow http where the response can be swapped.
    return url.protocol === "https:" && /^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(url.hostname);
  } catch {
    return false;
  }
}

async function signatureIsValid(envelope: SnsEnvelope): Promise<boolean> {
  const type = envelope.Type ?? "";
  const fields = SIGNED_FIELDS[type];

  if (!fields || !envelope.Signature || !envelope.SigningCertURL) return false;
  if (!isAwsCertificateUrl(envelope.SigningCertURL)) return false;

  let canonical = "";
  for (const field of fields) {
    const value = envelope[field as keyof SnsEnvelope];
    // Subject is genuinely absent on most notifications; absent fields are
    // omitted from the signed string rather than included as empty.
    if (value === undefined || value === null) continue;
    canonical += `${field}\n${value}\n`;
  }

  let certificate = certificateCache.get(envelope.SigningCertURL);
  if (!certificate) {
    const response = await fetch(envelope.SigningCertURL);
    if (!response.ok) return false;
    certificate = await response.text();
    certificateCache.set(envelope.SigningCertURL, certificate);
  }

  const algorithm = envelope.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1";

  try {
    return crypto.createVerify(algorithm).update(canonical, "utf8").verify(certificate, envelope.Signature, "base64");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  let envelope: SnsEnvelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Pin to our own topic when configured, so a valid signature from some other
  // SNS topic in any AWS account cannot write to our suppression list.
  const expectedTopic = process.env.SES_SNS_TOPIC_ARN;
  if (expectedTopic && envelope.TopicArn !== expectedTopic) {
    return NextResponse.json({ error: "Unexpected topic." }, { status: 403 });
  }

  if (!(await signatureIsValid(envelope))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  if (envelope.Type === "SubscriptionConfirmation") {
    // SNS treats the endpoint as unconfirmed until this URL is fetched. Safe to
    // do automatically only because the signature and topic were verified above.
    // The confirmation URL is an SNS endpoint too, so it gets the same host
    // check — a signed message must not be able to make us fetch anywhere.
    if (!envelope.SubscribeURL || !isAwsCertificateUrl(envelope.SubscribeURL)) {
      return NextResponse.json({ error: "Unusable SubscribeURL." }, { status: 400 });
    }

    await fetch(envelope.SubscribeURL).catch(() => undefined);
    return NextResponse.json({ confirmed: true });
  }

  if (envelope.Type !== "Notification") {
    return NextResponse.json({ received: true, ignored: envelope.Type ?? "unknown" });
  }

  let sesEvent: unknown;
  try {
    sesEvent = JSON.parse(envelope.Message ?? "");
  } catch {
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
