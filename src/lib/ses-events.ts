import type { NormalizedEmailEvent } from "@/lib/email-ingest";

/**
 * Translates an SES event-publishing payload into our normalized events.
 *
 * Pure and synchronous so the mapping can be tested without AWS. The subtlety
 * worth knowing is bounce classification: SES reports Permanent, Transient and
 * Undetermined bounces through the same event, and only a Permanent one means
 * the address is dead. A full mailbox or a greylisting delay is Transient, and
 * suppressing on it would quietly delete reachable prospects from the list
 * forever. Only Permanent maps to "bounced" (which suppresses); the rest map to
 * "failed", which records what happened without poisoning the address.
 */
export function sesEventToNormalized(payload: unknown): NormalizedEmailEvent[] {
  if (typeof payload !== "object" || payload === null) return [];

  const event = payload as Record<string, unknown>;
  // Event publishing uses eventType; older SNS bounce/complaint notifications
  // sent straight from an identity use notificationType.
  const kind = String(event.eventType ?? event.notificationType ?? "");
  const mail = (event.mail ?? {}) as Record<string, unknown>;
  const externalId = typeof mail.messageId === "string" ? mail.messageId : undefined;
  const destinations = Array.isArray(mail.destination) ? mail.destination.filter((d): d is string => typeof d === "string") : [];

  const at = (value: unknown): Date | undefined => {
    if (typeof value !== "string") return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const base = (email: string, type: NormalizedEmailEvent["type"], occurredAt?: Date, extra: Partial<NormalizedEmailEvent> = {}) =>
    ({ type, email, externalId, occurredAt, ...extra }) satisfies NormalizedEmailEvent;

  switch (kind) {
    case "Bounce": {
      const bounce = (event.bounce ?? {}) as Record<string, unknown>;
      const permanent = bounce.bounceType === "Permanent";
      const occurredAt = at(bounce.timestamp);
      const recipients = Array.isArray(bounce.bouncedRecipients) ? bounce.bouncedRecipients : [];

      return recipients.flatMap((entry) => {
        const recipient = entry as Record<string, unknown>;
        const email = typeof recipient.emailAddress === "string" ? recipient.emailAddress : null;
        if (!email) return [];
        const reason = [bounce.bounceType, bounce.bounceSubType, recipient.diagnosticCode]
          .filter((part) => typeof part === "string" && part)
          .join(" · ")
          .slice(0, 500);
        return [base(email, permanent ? "bounced" : "failed", occurredAt, { reason })];
      });
    }

    case "Complaint": {
      const complaint = (event.complaint ?? {}) as Record<string, unknown>;
      const occurredAt = at(complaint.timestamp);
      const recipients = Array.isArray(complaint.complainedRecipients) ? complaint.complainedRecipients : [];

      return recipients.flatMap((entry) => {
        const email = (entry as Record<string, unknown>).emailAddress;
        return typeof email === "string"
          ? [base(email, "complained", occurredAt, {
              reason: typeof complaint.complaintFeedbackType === "string" ? complaint.complaintFeedbackType : undefined,
            })]
          : [];
      });
    }

    case "Delivery": {
      const delivery = (event.delivery ?? {}) as Record<string, unknown>;
      const occurredAt = at(delivery.timestamp);
      const recipients = Array.isArray(delivery.recipients)
        ? delivery.recipients.filter((r): r is string => typeof r === "string")
        : destinations;
      return recipients.map((email) => base(email, "delivered", occurredAt));
    }

    case "Send":
      return destinations.map((email) => base(email, "sent", at(mail.timestamp)));

    case "Open": {
      const open = (event.open ?? {}) as Record<string, unknown>;
      return destinations.map((email) => base(email, "opened", at(open.timestamp)));
    }

    case "Click": {
      const click = (event.click ?? {}) as Record<string, unknown>;
      const url = typeof click.link === "string" ? click.link.slice(0, 2000) : undefined;
      return destinations.map((email) => base(email, "clicked", at(click.timestamp), { url }));
    }

    case "Reject": {
      const reject = (event.reject ?? {}) as Record<string, unknown>;
      const reason = typeof reject.reason === "string" ? reject.reason.slice(0, 500) : undefined;
      return destinations.map((email) => base(email, "failed", at(mail.timestamp), { reason }));
    }

    case "Rendering Failure": {
      const failure = (event.failure ?? {}) as Record<string, unknown>;
      const reason = typeof failure.errorMessage === "string" ? failure.errorMessage.slice(0, 500) : undefined;
      return destinations.map((email) => base(email, "failed", at(mail.timestamp), { reason }));
    }

    // DeliveryDelay is not a failure yet — SES retries, and most delays deliver.
    // Recording it as failed would make the dashboard read worse than reality.
    // Subscription events are list-management, not engagement.
    default:
      return [];
  }
}
