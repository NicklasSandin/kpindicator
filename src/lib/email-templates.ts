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
    key: "venture-studio",
    name: "Venture studio — batch triage",
    subject: "Killing the weak ideas before your team builds them",
    bodyText: `Hi {{firstName}},

Studios don't lose money on the ideas they reject. They lose it on the ones that survive three months of design and build before anyone finds out.

We run the demand test first: a real landing page per idea, real paid and outreach traffic, and a ranked go / no-go across the batch. Two to four weeks, before a developer touches anything.

Being straight with you — we're early and taking on five clients at a reduced rate in exchange for permission to publish the results. You get the work cheaper, we get a case study with real numbers instead of an illustrative one.

If {{company}} has a batch coming up, I'll show you how we'd rank it.

— {{senderName}}`,
    followUps: [
      `Hi {{firstName}}, the part studios usually push on is the threshold — what number actually counts as a go. We agree that with you before any traffic runs, so the result isn't arguable after the fact. Happy to show you how we set it.`,
      `Last one from me, {{firstName}}. If a batch comes up later and you want an outside read before committing build time, the offer stands.`,
    ],
  },
  {
    key: "agency-white-label",
    name: "Agency — white-label validation",
    subject: "Validation for your clients, under your brand",
    bodyText: `Hi {{firstName}},

When a client asks {{company}} to build something, "we tested it, here's what buyers actually did" is a better conversation than "here's our estimate."

We run that test white-label: landing page, real traffic, qualified leads, and a written go / no-go your client can act on. You keep the relationship and the build work — we just supply the evidence.

Being straight: we're early and doing five engagements at a reduced rate in exchange for permission to publish the results, anonymised if your client prefers.

If someone's about to commit to a build on a hunch, I'll show you what we'd run.

— {{senderName}}`,
    followUps: [
      `Hi {{firstName}}, the useful version of this is running it before the proposal rather than after — it changes what you're able to quote for. Happy to sketch how that sequences.`,
      `Closing the loop, {{firstName}}. If a client project ever needs outside demand evidence, I can outline the process in ten minutes.`,
    ],
  },
  {
    key: "corporate-innovation",
    name: "Corporate innovation — stage gate evidence",
    subject: "Outside demand evidence for the stage gate",
    bodyText: `Hi {{firstName}},

The hard part of an internal innovation case usually isn't the idea. It's that every number supporting it came from inside the building.

We produce the outside evidence: a real landing page, real paid traffic, measured conversion, and a written go / no-go against a threshold agreed before the test runs — so the result isn't something anyone can re-argue afterwards.

Being straight: we're early and taking five clients at a reduced rate in exchange for permission to publish results, anonymised if procurement needs that.

If there's an initiative heading for a gate, I'll outline what we'd test.

— {{senderName}}`,
    followUps: [
      `Hi {{firstName}}, the detail that matters for a committee is agreeing the go / no-go number up front. It turns the result into a decision rather than a discussion. Happy to share how we word it.`,
      `Last note, {{firstName}}. If an initiative needs external validation before funding, I'm easy to reach.`,
    ],
  },
] as const;

export function renderEmailTemplate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/{{\s*([a-zA-Z]+)\s*}}/g, (_, key: string) => values[key] || "");
}
