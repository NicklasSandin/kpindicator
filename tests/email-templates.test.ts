import assert from "node:assert/strict";
import test from "node:test";
import { EMAIL_TEMPLATES, renderEmailTemplate } from "../src/lib/email-templates";

test("starter campaigns include concise follow-ups", () => {
  assert.equal(EMAIL_TEMPLATES.length, 3);
  assert.ok(EMAIL_TEMPLATES.every((template) => template.followUps.length === 2));
});

test("template values render without leaving known placeholders", () => {
  assert.equal(renderEmailTemplate("Hi {{firstName}} at {{company}}", { firstName: "Ari", company: "Northbeam" }), "Hi Ari at Northbeam");
});
