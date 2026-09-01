import assert from "node:assert/strict";
import test from "node:test";
import { shouldAdvanceEmailStatus } from "../src/lib/email-events";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../src/lib/campaign-email";

test("engagement advances monotonically", () => {
  assert.equal(shouldAdvanceEmailStatus("DELIVERED", "OPENED"), true);
  assert.equal(shouldAdvanceEmailStatus("CLICKED", "DELIVERED"), false);
});

test("unsubscribe tokens are signed and reject tampering", () => {
  const token = createUnsubscribeToken("recipient-123");
  assert.equal(verifyUnsubscribeToken(token), "recipient-123");
  assert.equal(verifyUnsubscribeToken(`${token}tampered`), null);
});

test("suppression states are terminal and can supersede engagement", () => {
  assert.equal(shouldAdvanceEmailStatus("CLICKED", "UNSUBSCRIBED"), true);
  assert.equal(shouldAdvanceEmailStatus("UNSUBSCRIBED", "OPENED"), false);
});
