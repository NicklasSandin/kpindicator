import assert from "node:assert/strict";
import test from "node:test";
import { parseRecipients } from "../src/lib/email-recipients";

test("recipient parser normalizes, validates, and deduplicates email addresses", () => {
  assert.deepEqual(parseRecipients(`Jordan Reyes <JORDAN@example.com>, Northbeam\njordan@example.com, Duplicate\nnot-an-email\nplain@example.org`), [
    { name: undefined, email: "jordan@example.com", company: "Duplicate" },
    { name: undefined, email: "plain@example.org", company: undefined },
  ]);
});

test("recipient parser accepts a name,email,company CSV with a header", () => {
  assert.deepEqual(parseRecipients("name,email,company\n\"Ari Lane\",ari@example.com,Acme"), [
    { name: "Ari Lane", email: "ari@example.com", company: "Acme" },
  ]);
});
