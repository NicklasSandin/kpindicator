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
  | "sha1_disabled_by_platform"
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
/**
 * Whether this host will verify SHA-1 signatures at all.
 *
 * RHEL-family systems ship a crypto policy that disables SHA-1 in signatures,
 * and Node uses the system OpenSSL — so verify() simply returns false for a
 * correct SNS SignatureVersion 1 message. Nothing throws and nothing explains
 * itself, which makes it indistinguishable from a forged signature. Probing
 * once turns that into an actionable message.
 */
let sha1Available: boolean | null = null;

export function sha1VerificationAvailable(): boolean {
  if (sha1Available !== null) return sha1Available;

  try {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    const signature = crypto.createSign("RSA-SHA1").update("probe", "utf8").sign(privateKey);
    sha1Available = crypto.createVerify("RSA-SHA1").update("probe", "utf8").verify(publicKey, signature);
  } catch {
    sha1Available = false;
  }

  return sha1Available;
}

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

  // Report the platform limitation rather than blaming the message. The fix is
  // to set the SNS topic's SignatureVersion to 2, which signs with SHA-256 —
  // the right direction anyway, since SHA-1 is why the policy blocks it.
  if (algorithm === "RSA-SHA1" && !sha1VerificationAvailable()) {
    return { ok: false, reason: "sha1_disabled_by_platform" };
  }

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
