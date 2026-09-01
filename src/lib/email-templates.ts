export const EMAIL_TEMPLATES = [
  {
    key: "unbuilt-idea",
    name: "Founder with an unbuilt idea",
    subject: "Before you build {{idea}}",
    bodyText: `Hi {{firstName}},

I noticed {{company}} is exploring {{idea}}.

You may not need another opinion—you need evidence. KPIndicator tests the offer with a real landing page and targeted outreach before you invest in the full build.

Want me to send you a quick validation angle for the idea?

— {{senderName}}`,
    followUps: [
      `Hi {{firstName}}, quick follow-up: I had one thought about how to test demand for {{idea}} without building the product first. Want me to send it over?`,
      `Last note from me, {{firstName}}. If {{idea}} is still on the roadmap, I’m happy to outline the smallest credible demand test. If not, no reply needed.`,
    ],
  },
  {
    key: "several-ideas",
    name: "Founder choosing between ideas",
    subject: "Which idea should you build?",
    bodyText: `Hi {{firstName}},

When several ideas look promising, internal debate rarely settles which one buyers will choose.

KPIndicator tests the offers in parallel, measures real buyer behavior, and ranks them before your team commits to a build.

Want me to send you a quick validation angle for your shortlist?

— {{senderName}}`,
    followUps: [
      `Hi {{firstName}}, the useful part of a parallel test is agreeing on the same threshold for every idea before traffic starts. Happy to share a simple example if useful.`,
      `Closing the loop, {{firstName}}. If choosing the next build becomes a live decision, I can outline how we would compare the ideas fairly.`,
    ],
  },
  {
    key: "agency-studio",
    name: "Agency or venture studio",
    subject: "A faster way to reject weak ideas",
    bodyText: `Hi {{firstName}},

Studios lose expensive design and development time when weak ideas survive too long.

KPIndicator provides a repeatable validation layer: landing pages, targeted outreach, buyer signals, and a clear recommendation before delivery resources are committed.

Want me to send you a quick validation angle for one idea in the pipeline?

— {{senderName}}`,
    followUps: [
      `Hi {{firstName}}, this can run under your agency’s brand and gives the client evidence either way—not a report designed to justify a build. Want a sample test structure?`,
      `Last note, {{firstName}}. If you ever need an outside validation layer before scoping a build, I’m happy to show you the process.`,
    ],
  },
] as const;

export function renderEmailTemplate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/{{\s*([a-zA-Z]+)\s*}}/g, (_, key: string) => values[key] || "");
}
