import assert from "node:assert/strict";
import test from "node:test";
import { sesEventToNormalized } from "../src/lib/ses-events";

const mail = (destination: string[] = ["ari@northbeam.co"]) => ({
  messageId: "0100018e-abc-000000",
  timestamp: "2026-09-01T10:00:00.000Z",
  destination,
});

test("a permanent bounce suppresses the address", () => {
  const [event] = sesEventToNormalized({
    eventType: "Bounce",
    mail: mail(),
    bounce: {
      bounceType: "Permanent",
      bounceSubType: "General",
      timestamp: "2026-09-01T10:00:05.000Z",
      bouncedRecipients: [{ emailAddress: "ari@northbeam.co", diagnosticCode: "smtp; 550 5.1.1 user unknown" }],
    },
  });

  assert.equal(event.type, "bounced", "permanent bounces must suppress");
  assert.equal(event.email, "ari@northbeam.co");
  assert.match(event.reason ?? "", /Permanent/);
  assert.match(event.reason ?? "", /550/);
});

test("a transient bounce does NOT suppress the address", () => {
  // The distinction that matters: a full mailbox is temporary. Suppressing on
  // it would delete a reachable prospect from every future campaign.
  const [event] = sesEventToNormalized({
    eventType: "Bounce",
    mail: mail(),
    bounce: {
      bounceType: "Transient",
      bounceSubType: "MailboxFull",
      timestamp: "2026-09-01T10:00:05.000Z",
      bouncedRecipients: [{ emailAddress: "ari@northbeam.co" }],
    },
  });

  assert.equal(event.type, "failed", "transient bounces must not suppress");
});

test("an undetermined bounce does not suppress either", () => {
  const [event] = sesEventToNormalized({
    eventType: "Bounce",
    mail: mail(),
    bounce: { bounceType: "Undetermined", bouncedRecipients: [{ emailAddress: "ari@northbeam.co" }] },
  });

  assert.equal(event.type, "failed");
});

test("one event per bounced recipient", () => {
  const events = sesEventToNormalized({
    eventType: "Bounce",
    mail: mail(["a@x.co", "b@x.co"]),
    bounce: {
      bounceType: "Permanent",
      bouncedRecipients: [{ emailAddress: "a@x.co" }, { emailAddress: "b@x.co" }],
    },
  });

  assert.equal(events.length, 2);
  assert.deepEqual(events.map((e) => e.email).sort(), ["a@x.co", "b@x.co"]);
});

test("a complaint is recorded with its feedback type", () => {
  const [event] = sesEventToNormalized({
    eventType: "Complaint",
    mail: mail(),
    complaint: {
      complainedRecipients: [{ emailAddress: "ari@northbeam.co" }],
      complaintFeedbackType: "abuse",
      timestamp: "2026-09-01T11:00:00.000Z",
    },
  });

  assert.equal(event.type, "complained");
  assert.equal(event.reason, "abuse");
  assert.equal(event.occurredAt?.toISOString(), "2026-09-01T11:00:00.000Z");
});

test("deliveries, opens, sends and clicks map across", () => {
  const delivered = sesEventToNormalized({ eventType: "Delivery", mail: mail(), delivery: { recipients: ["ari@northbeam.co"] } });
  assert.equal(delivered[0].type, "delivered");

  const sent = sesEventToNormalized({ eventType: "Send", mail: mail() });
  assert.equal(sent[0].type, "sent");

  const opened = sesEventToNormalized({ eventType: "Open", mail: mail(), open: { timestamp: "2026-09-01T12:00:00.000Z" } });
  assert.equal(opened[0].type, "opened");

  const clicked = sesEventToNormalized({ eventType: "Click", mail: mail(), click: { link: "https://kpindicator.com/validate" } });
  assert.equal(clicked[0].type, "clicked");
  assert.equal(clicked[0].url, "https://kpindicator.com/validate");
});

test("a rejected send is a failure, not a bounce", () => {
  const [event] = sesEventToNormalized({ eventType: "Reject", mail: mail(), reject: { reason: "Bad content" } });
  assert.equal(event.type, "failed");
  assert.equal(event.reason, "Bad content");
});

test("a delivery delay produces nothing", () => {
  // SES retries these and most then deliver. Recording them would make the
  // campaign dashboard read worse than reality.
  assert.deepEqual(sesEventToNormalized({ eventType: "DeliveryDelay", mail: mail(), deliveryDelay: {} }), []);
});

test("the SES message id is carried through for exact matching", () => {
  const [event] = sesEventToNormalized({ eventType: "Delivery", mail: mail(), delivery: { recipients: ["ari@northbeam.co"] } });
  assert.equal(event.externalId, "0100018e-abc-000000");
});

test("older notificationType payloads still map", () => {
  const [event] = sesEventToNormalized({
    notificationType: "Complaint",
    mail: mail(),
    complaint: { complainedRecipients: [{ emailAddress: "ari@northbeam.co" }] },
  });

  assert.equal(event.type, "complained");
});

test("malformed payloads produce nothing rather than throwing", () => {
  assert.deepEqual(sesEventToNormalized(null), []);
  assert.deepEqual(sesEventToNormalized("nonsense"), []);
  assert.deepEqual(sesEventToNormalized({}), []);
  assert.deepEqual(sesEventToNormalized({ eventType: "Bounce" }), []);
  assert.deepEqual(sesEventToNormalized({ eventType: "Unheard-of", mail: mail() }), []);
});
