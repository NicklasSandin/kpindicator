import crypto from "node:crypto";

export type SnsEnvelope = {
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

/**
 * The exact fields, in the exact order, that SNS signs per message type.
 * Order is part of the signature — a different order produces a different
 * digest and every message fails.
 */
const SIGNED_FIELDS: Record<string, string[]> = {
  Notification: ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"],
  SubscriptionConfirmation: ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"],
  UnsubscribeConfirmation: ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"],
};

/** Only AWS's own signing hosts, over https. */
export function isAwsSigningUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && /^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Build the string SNS signed. Fields absent from the message are omitted
 * entirely rather than included empty — Subject is genuinely absent from most
 * notifications, and including it as blank breaks the digest.
 */
export function canonicalString(envelope: SnsEnvelope): string | null {
  const fields = SIGNED_FIELDS[envelope.Type ?? ""];
  if (!fields) return null;

  let canonical = "";
  for (const field of fields) {
    const value = envelope[field as keyof SnsEnvelope];
    if (value === undefined || value === null) continue;
    canonical += `${field}\n${value}\n`;
  }

  return canonical;
}

export type VerifyFailure =
  | "unknown_type"
  | "missing_signature"
  | "bad_cert_url"
  | "cert_unavailable"
  | "signature_mismatch";

export type VerifyResult = { ok: true } | { ok: false; reason: VerifyFailure };

/**
 * Verify an SNS message signature.
 *
 * The certificate fetcher is injected so the crypto can be tested without
 * network access — the canonical-string construction is the part that is easy
 * to get subtly wrong and impossible to debug from a 403 in a log.
 */
export async function verifySnsSignature(
  envelope: SnsEnvelope,
  fetchCertificate: (url: string) => Promise<string | null>,
): Promise<VerifyResult> {
  const canonical = canonicalString(envelope);
  if (canonical === null) return { ok: false, reason: "unknown_type" };
  if (!envelope.Signature) return { ok: false, reason: "missing_signature" };
  if (!envelope.SigningCertURL || !isAwsSigningUrl(envelope.SigningCertURL)) {
    return { ok: false, reason: "bad_cert_url" };
  }

  const certificate = await fetchCertificate(envelope.SigningCertURL);
  if (!certificate) return { ok: false, reason: "cert_unavailable" };

  const algorithm = envelope.SignatureVersion === "2" ? "RSA-SHA256" : "RSA-SHA1";

  try {
    const verified = crypto
      .createVerify(algorithm)
      .update(canonical, "utf8")
      .verify(certificate, envelope.Signature, "base64");

    return verified ? { ok: true } : { ok: false, reason: "signature_mismatch" };
  } catch {
    return { ok: false, reason: "signature_mismatch" };
  }
}
