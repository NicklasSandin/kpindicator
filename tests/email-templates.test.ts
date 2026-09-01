import assert from "node:assert/strict";
import test from "node:test";
import { EMAIL_TEMPLATES, renderEmailTemplate } from "../src/lib/email-templates";

/** Every placeholder the campaign sender is able to supply. */
const SUPPORTED_PLACEHOLDERS = ["firstName", "company", "idea", "senderName"];

test("every starter campaign is complete and uniquely keyed", () => {
  assert.ok(EMAIL_TEMPLATES.length > 0);

  const keys = EMAIL_TEMPLATES.map((t) => t.key);
  assert.equal(
    new Set(keys).size,
    keys.length,
    "template keys must be unique — EmailCampaign.templateKey refers to them",
  );

  for (const template of EMAIL_TEMPLATES) {
    assert.ok(template.name.trim(), `${template.key} has no name`);
    assert.ok(template.subject.trim(), `${template.key} has no subject`);
    assert.ok(template.bodyText.trim(), `${template.key} has no body`);
    assert.equal(template.followUps.length, 2, `${template.key} should have two follow-ups`);
  }
});

test("outbound covers the segments the go-to-market targets", () => {
  // docs/pitch.md §08: direct outbound to studios, agencies and corporate
  // innovation. If a template is dropped, the plan loses a channel silently.
  // Widened deliberately: EMAIL_TEMPLATES is `as const`, so key is a literal
  // union and includes() would reject any string not already in it — which
  // would make this assertion impossible to fail.
  const keys: string[] = EMAIL_TEMPLATES.map((t) => t.key);
  for (const segment of ["venture-studio", "agency-white-label", "corporate-innovation"]) {
    assert.ok(keys.includes(segment), `no outbound template for ${segment}`);
  }
});

test("no template uses a placeholder the sender cannot fill", () => {
  // A misspelled token renders empty, so a cold email opens "Hi ," — worse
  // than not sending it. Catch it here rather than in someone's inbox.
  for (const template of EMAIL_TEMPLATES) {
    const text = [template.subject, template.bodyText, ...template.followUps].join("\n");
    for (const [, token] of text.matchAll(/{{\s*([a-zA-Z]+)\s*}}/g)) {
      assert.ok(
        SUPPORTED_PLACEHOLDERS.includes(token),
        `${template.key} uses {{${token}}}, which nothing supplies`,
      );
    }
  }
});

test("a fully supplied render leaves no placeholder behind", () => {
  const values = { firstName: "Ari", company: "Northbeam", idea: "a ledger tool", senderName: "Nicklas" };

  for (const template of EMAIL_TEMPLATES) {
    for (const field of [template.subject, template.bodyText, ...template.followUps]) {
      const rendered = renderEmailTemplate(field, values);
      assert.ok(!rendered.includes("{{"), `${template.key} still contains a placeholder after rendering`);
    }
  }
});

test("template values render without leaving known placeholders", () => {
  assert.equal(
    renderEmailTemplate("Hi {{firstName}} at {{company}}", { firstName: "Ari", company: "Northbeam" }),
    "Hi Ari at Northbeam",
  );
});
