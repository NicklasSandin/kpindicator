import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { canonicalString, isAwsSigningUrl, sha1VerificationAvailable, verifySnsSignature } from "../src/lib/sns-signature";

/**
 * A real RSA keypair and a self-signed certificate, so the crypto path is
 * exercised exactly as it is against AWS — only the certificate's origin
 * differs. This is the part that cannot be debugged from a 403 in a log.
 */
function makeSigner() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
  return {
    pem,
    sign: (canonical: string, algorithm = "RSA-SHA1") =>
      crypto.createSign(algorithm).update(canonical, "utf8").sign(privateKey, "base64"),
  };
}

const CERT_URL = "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-abc.pem";

test("the canonical string matches AWS's documented field order", () => {
  const canonical = canonicalString({
    Type: "SubscriptionConfirmation",
    Message: "You have chosen to subscribe",
    MessageId: "m-1",
    SubscribeURL: "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription",
    Timestamp: "2026-09-01T11:16:46.000Z",
    Token: "tok",
    TopicArn: "arn:aws:sns:us-east-1:553560450375:kpindicator-outbound",
  });

  assert.equal(
    canonical,
    [
      "Message", "You have chosen to subscribe",
      "MessageId", "m-1",
      "SubscribeURL", "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription",
      "Timestamp", "2026-09-01T11:16:46.000Z",
      "Token", "tok",
      "TopicArn", "arn:aws:sns:us-east-1:553560450375:kpindicator-outbound",
      "Type", "SubscriptionConfirmation",
    ].join("\n") + "\n",
  );
});

test("a notification without a Subject omits the field entirely", () => {
  // Including it as empty is the classic way to break every notification.
  const canonical = canonicalString({
    Type: "Notification", Message: "{}", MessageId: "m-2",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
  });

  assert.ok(!canonical?.includes("Subject"), "absent Subject must not appear");
});

test("a notification with a Subject includes it in position", () => {
  const canonical = canonicalString({
    Type: "Notification", Message: "{}", MessageId: "m-3", Subject: "hi",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
  });

  assert.match(canonical ?? "", /MessageId\nm-3\nSubject\nhi\nTimestamp/);
});

test("a genuinely signed subscription confirmation verifies", async () => {
  const signer = makeSigner();
  const envelope = {
    Type: "SubscriptionConfirmation",
    Message: "You have chosen to subscribe",
    MessageId: "m-4",
    SubscribeURL: "https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=x",
    Timestamp: "2026-09-01T11:16:46.000Z",
    Token: "tok",
    TopicArn: "arn:aws:sns:us-east-1:553560450375:kpindicator-outbound",
    SignatureVersion: "1",
    SigningCertURL: CERT_URL,
    Signature: "",
  };
  envelope.Signature = signer.sign(canonicalString(envelope)!);

  assert.deepEqual(await verifySnsSignature(envelope, async () => signer.pem), { ok: true });
});

test("SignatureVersion 2 verifies with SHA256", async () => {
  const signer = makeSigner();
  const envelope = {
    Type: "Notification", Message: '{"eventType":"Bounce"}', MessageId: "m-5",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
    SignatureVersion: "2", SigningCertURL: CERT_URL, Signature: "",
  };
  envelope.Signature = signer.sign(canonicalString(envelope)!, "RSA-SHA256");

  assert.deepEqual(await verifySnsSignature(envelope, async () => signer.pem), { ok: true });
});

test("a tampered message is rejected", async () => {
  const signer = makeSigner();
  const envelope = {
    Type: "Notification", Message: '{"eventType":"Bounce"}', MessageId: "m-6",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
    SignatureVersion: "1", SigningCertURL: CERT_URL, Signature: "",
  };
  envelope.Signature = signer.sign(canonicalString(envelope)!);
  envelope.Message = '{"eventType":"Complaint"}';

  assert.deepEqual(await verifySnsSignature(envelope, async () => signer.pem), {
    ok: false, reason: "signature_mismatch",
  });
});

test("a signature from the wrong key is rejected", async () => {
  const real = makeSigner();
  const attacker = makeSigner();
  const envelope = {
    Type: "Notification", Message: "{}", MessageId: "m-7",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
    SignatureVersion: "1", SigningCertURL: CERT_URL, Signature: "",
  };
  envelope.Signature = attacker.sign(canonicalString(envelope)!);

  assert.deepEqual(await verifySnsSignature(envelope, async () => real.pem), {
    ok: false, reason: "signature_mismatch",
  });
});

test("only AWS signing hosts over https are accepted", () => {
  assert.equal(isAwsSigningUrl("https://sns.us-east-1.amazonaws.com/x.pem"), true);
  assert.equal(isAwsSigningUrl("https://sns.ap-southeast-2.amazonaws.com/x.pem"), true);
  assert.equal(isAwsSigningUrl("http://sns.us-east-1.amazonaws.com/x.pem"), false, "http must be refused");
  assert.equal(isAwsSigningUrl("https://evil.example.com/x.pem"), false);
  assert.equal(isAwsSigningUrl("https://sns.us-east-1.amazonaws.com.evil.com/x.pem"), false, "suffix attack");
  assert.equal(isAwsSigningUrl("not a url"), false);
});

test("failures are distinguishable, so a 403 can be diagnosed", async () => {
  const signer = makeSigner();
  const base = {
    Type: "Notification", Message: "{}", MessageId: "m-8",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
    SignatureVersion: "1", SigningCertURL: CERT_URL,
  };

  assert.deepEqual(await verifySnsSignature({ ...base, Type: "Nonsense", Signature: "x" }, async () => signer.pem), { ok: false, reason: "unknown_type" });
  assert.deepEqual(await verifySnsSignature({ ...base }, async () => signer.pem), { ok: false, reason: "missing_signature" });
  assert.deepEqual(await verifySnsSignature({ ...base, Signature: "x", SigningCertURL: "https://evil.com/c.pem" }, async () => signer.pem), { ok: false, reason: "bad_cert_url" });
  assert.deepEqual(await verifySnsSignature({ ...base, Signature: "x" }, async () => null), { ok: false, reason: "cert_unavailable" });
});

test("a SHA-1 message on a host that forbids SHA-1 says so, rather than blaming the signature", async () => {
  const signer = makeSigner();
  const envelope = {
    Type: "Notification", Message: "{}", MessageId: "m-9",
    Timestamp: "2026-09-01T11:00:00.000Z", TopicArn: "arn:topic",
    SignatureVersion: "1", SigningCertURL: CERT_URL, Signature: "",
  };
  envelope.Signature = signer.sign(canonicalString(envelope)!);

  const result = await verifySnsSignature(envelope, async () => signer.pem);

  // On a permissive host this verifies; on a RHEL-family one it must name the
  // platform rather than report a mismatch, because those need opposite fixes.
  if (sha1VerificationAvailable()) {
    assert.deepEqual(result, { ok: true });
  } else {
    assert.deepEqual(result, { ok: false, reason: "sha1_disabled_by_platform" });
  }
});
