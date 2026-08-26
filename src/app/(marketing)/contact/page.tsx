import type { Metadata } from "next";
import { Suspense } from "react";
import { Clock, MessageSquare, ShieldCheck } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a validation call or send us your ideas directly. We read every message ourselves and reply within one business day.",
};

const EXPECTATIONS = [
  {
    icon: Clock,
    title: "Reply within 1 business day",
    detail: "Usually faster. A real person reads this, not a routing bot.",
  },
  {
    icon: MessageSquare,
    title: "A straight answer on fit",
    detail: "If we're not the right fit for what you're trying to do, we'll tell you that too.",
  },
  {
    icon: ShieldCheck,
    title: "No pressure, no hard sell",
    detail: "We'll ask what you're trying to figure out and tell you honestly what it'd take.",
  },
];

export default function ContactPage() {
  return (
    <Section border={false} className="pb-24">
      <SectionHeading
        eyebrow="Contact"
        title="Tell us what you're trying to figure out"
        description="Book a validation call, or send us your ideas directly — either way, a real operator reads this and replies."
      />

      <div className="mx-auto mt-14 grid max-w-4xl gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          {EXPECTATIONS.map((item) => (
            <div key={item.title} className="flex gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                <item.icon className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </Section>
  );
}
