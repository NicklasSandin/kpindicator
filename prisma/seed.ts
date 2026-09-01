/**
 * Seeds a demo client so the dashboard has real rows to render.
 * Deterministic PRNG (not Math.random) so re-seeding gives the same
 * numbers every time — makes screenshots and demos reproducible.
 */
import {
  PrismaClient,
  Channel,
  PackageType,
  EmailRecipientStatus,
  EmailEventType,
} from "@prisma/client";

const prisma = new PrismaClient();

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const daysAgo = (n: number) => {
  const d = new Date("2026-08-26T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

async function main() {
  console.log("Seeding demo data...");

  await prisma.order.deleteMany();
  await prisma.report.deleteMany();
  await prisma.metricSnapshot.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationInvitation.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.emailEvent.deleteMany();
  await prisma.emailRecipient.deleteMany();
  await prisma.emailCampaign.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "ops@kpindicator.co",
      name: "KPIndicator Ops",
      role: "ADMIN",
      company: "KPIndicator",
      emailVerifiedAt: new Date("2026-08-26T00:00:00Z"),
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "jordan@northbeamstudio.co",
      name: "Jordan Reyes",
      role: "CLIENT",
      company: "Northbeam Studio",
      emailVerifiedAt: new Date("2026-08-26T00:00:00Z"),
    },
  });

  const clientOrganization = await prisma.organization.create({
    data: {
      name: "Northbeam Studio",
      members: { create: { userId: client.id, role: "OWNER" } },
    },
  });

  // ---------------------------------------------------------------------
  // Project A — a completed Validation Sprint across 4 ideas
  // ---------------------------------------------------------------------
  const projectA = await prisma.project.create({
    data: {
      organizationId: clientOrganization.id,
      name: "Q2 Idea Batch — Validation Sprint",
      package: PackageType.VALIDATION_SPRINT,
      status: "COMPLETE",
      summary:
        "Four SMB-vertical SaaS concepts tested in parallel over 21 days across paid social, email, and outreach. One clear winner, one clear kill, two inconclusive.",
      startDate: daysAgo(52),
      targetCompleteDate: daysAgo(31),
      createdAt: daysAgo(53),
    },
  });

  const ideaSpecs = [
    {
      name: "Ledger",
      oneLiner: "AI bookkeeping built for solo landscaping & lawn care businesses.",
      hypothesis:
        "Solo operators in landscaping will pay $39/mo for bookkeeping software that auto-categorizes job-based income and expenses from their bank feed, because generic tools (QuickBooks, Wave) force them to build their own chart of accounts.",
      targetCustomer: "Owner-operator landscaping & lawn care businesses, 1-5 employees, US.",
      priorityRank: 1,
      status: "VALIDATED" as const,
      landingPageUrl: "https://get.kpindicator.co/ledger",
      channels: [Channel.PAID_SOCIAL, Channel.EMAIL] as Channel[],
      recommendation: "GO" as const,
    },
    {
      name: "Fleetwise",
      oneLiner: "Maintenance scheduling and compliance reminders for small vehicle fleets.",
      hypothesis:
        "Owners of 3-15 vehicle fleets will pay for a tool that predicts maintenance windows and flags compliance deadlines, because they currently track it in spreadsheets and miss inspections.",
      targetCustomer: "Small fleet owners (landscaping, HVAC, delivery), 3-15 vehicles.",
      priorityRank: 2,
      status: "INCONCLUSIVE" as const,
      landingPageUrl: "https://get.kpindicator.co/fleetwise",
      channels: [Channel.PAID_SOCIAL, Channel.OUTREACH] as Channel[],
      recommendation: "MORE_DATA_NEEDED" as const,
    },
    {
      name: "Homebase Pro",
      oneLiner: "Done-for-you turnover concierge subscription for Airbnb hosts.",
      hypothesis:
        "Hosts running 2+ listings will subscribe to a flat monthly fee that bundles cleaning coordination, restocking, and guest messaging, because juggling vendors manually costs them bookings.",
      targetCustomer: "Airbnb hosts with 2+ active listings, non-superhost tier.",
      priorityRank: 3,
      status: "INVALIDATED" as const,
      landingPageUrl: "https://get.kpindicator.co/homebase-pro",
      channels: [Channel.PAID_SOCIAL, Channel.EMAIL] as Channel[],
      recommendation: "NO_GO" as const,
    },
    {
      name: "PitchDeck AI",
      oneLiner: "Turns a founder's raw notes into an investor-ready deck in one sitting.",
      hypothesis:
        "Solo, first-time founders raising a pre-seed round will pay a one-time fee for an AI tool that structures their pitch, because they don't know what a VC-standard deck looks like.",
      targetCustomer: "First-time solo founders, pre-seed, US & UK.",
      priorityRank: 4,
      status: "INCONCLUSIVE" as const,
      landingPageUrl: "https://get.kpindicator.co/pitchdeck-ai",
      channels: [Channel.EMAIL, Channel.OUTREACH] as Channel[],
      recommendation: "MORE_DATA_NEEDED" as const,
    },
  ];

  for (const spec of ideaSpecs) {
    const idea = await prisma.idea.create({
      data: {
        projectId: projectA.id,
        name: spec.name,
        oneLiner: spec.oneLiner,
        hypothesis: spec.hypothesis,
        targetCustomer: spec.targetCustomer,
        priorityRank: spec.priorityRank,
        status: spec.status,
        landingPageUrl: spec.landingPageUrl,
        createdAt: daysAgo(50),
      },
    });

    for (const channel of spec.channels) {
      const isWinner = spec.status === "VALIDATED";
      const isDead = spec.status === "INVALIDATED";
      const baseVisitors = isWinner ? 90 : isDead ? 60 : 70;
      const convStrength = isWinner ? 0.11 : isDead ? 0.02 : 0.055;

      const campaign = await prisma.campaign.create({
        data: {
          ideaId: idea.id,
          channel,
          name: `${spec.name} — ${channel.replace("_", " ").toLowerCase()}`,
          status: "COMPLETE",
          budgetCents: int(30000, 90000),
          startDate: daysAgo(45),
          endDate: daysAgo(24),
        },
      });

      for (let d = 45; d >= 24; d -= 3) {
        const visitors = int(baseVisitors - 20, baseVisitors + 30);
        const leads = Math.max(0, Math.round(visitors * convStrength * rand() * 1.4 + visitors * convStrength * 0.6));
        const signups = Math.round(leads * (isWinner ? 0.55 : 0.3));
        const preorders = isWinner && channel === Channel.EMAIL ? int(0, 4) : 0;
        await prisma.metricSnapshot.create({
          data: {
            campaignId: campaign.id,
            date: daysAgo(d),
            visitors,
            leads,
            signups,
            preorders,
            spendCents: int(1500, 6000),
          },
        });
      }
    }

    const reportBodies: Record<string, string> = {
      Ledger: `## Summary\n\nLedger was the clearest signal in this batch. Paid social to landscaping-owner lookalike audiences drove a **9.8% visitor-to-lead conversion rate**, more than 3x the batch average, and email outreach to a rented list of 1,200 landscaping-association contacts converted at 14.2%. Four leads converted to paid deposits ($49 each) without any sales call.\n\n## What we tested\n\n- Positioning A: "Bookkeeping that already knows what a mowing job is"\n- Positioning B: "QuickBooks is not built for landscapers"\n- Pricing: $29, $39, $59/mo, presented via a pricing toggle\n\nPositioning A outperformed B by 2.1x on click-through. $39/mo was the modal choice in the pricing toggle (58% of interactions).\n\n## Recommendation: GO\n\nProceed to build. Recommend shipping a narrow v1 (bank feed import + job-based categorization only) to the 34 leads who opted into early access, priced at $39/mo with a 3-month founder rate of $29/mo.\n\n## Risks\n\n- Sample is landscaping-specific; positioning may not transfer to adjacent trades without re-testing.\n- Deposit-payers are not yet using a live product — presale conversion to activation is unproven.`,
      Fleetwise: `## Summary\n\nFleetwise produced a moderate but noisy signal. Paid social conversion (5.1%) was in line with category benchmarks, but outreach to fleet owners via cold email underperformed (1.3% reply rate) and skewed the blended numbers down.\n\n## What we tested\n\n- Positioning: "Never miss a DOT inspection again" vs. "Fleet maintenance on autopilot"\n- Channel mix: paid social carried 78% of total leads\n\n## Recommendation: More data needed\n\nThe paid social channel alone clears our go-threshold; outreach does not. Recommend a follow-up two-week sprint isolating paid social with a larger budget before committing to build.\n\n## Risks\n\n- Outreach list quality was unverified (purchased list, 22% bounce rate) and likely deflated the blended numbers unfairly.`,
      "Homebase Pro": `## Summary\n\nHomebase Pro did not clear threshold. Visitor volume was healthy (comparable to Ledger), but conversion to lead was 1.9%, well under our 4% minimum bar, and zero leads progressed to a qualification call in 21 days.\n\n## What we tested\n\n- Positioning: "Your turnover, handled" vs. "Stop managing five vendors for one guest"\n- Price anchor: $149/mo flat fee\n\nExit-intent survey responses (n=41) point to the core issue: hosts trust their existing cleaner relationships and see a subscription as redundant, not additive.\n\n## Recommendation: NO-GO\n\nDo not proceed to build in current form. If revisited, re-scope around a single high-friction task (restocking) rather than full concierge bundling.`,
      "PitchDeck AI": `## Summary\n\nPitchDeck AI landed in the middle: strong open rates on cold email (38%) but weak conversion from click to landing page signup (2.4%), suggesting a message-market mismatch between the email hook and the page itself rather than a demand problem.\n\n## Recommendation: More data needed\n\nRecommend one more short sprint (10 days) with a rewritten landing page matched to the email's specific framing ("investor-ready in one sitting") before making a final call.`,
    };

    await prisma.report.create({
      data: {
        projectId: projectA.id,
        ideaId: idea.id,
        title: `${spec.name} — Validation Report`,
        recommendation: spec.recommendation,
        summary: spec.oneLiner,
        body: reportBodies[spec.name],
        publishedAt: daysAgo(22),
        createdAt: daysAgo(22),
      },
    });
  }

  await prisma.report.create({
    data: {
      projectId: projectA.id,
      title: "Q2 Idea Batch — Final Validation Report",
      recommendation: "GO",
      summary:
        "Of 4 ideas tested, Ledger is a clear GO. Homebase Pro is a clear NO-GO. Fleetwise and PitchDeck AI need a follow-up sprint before a call can be made.",
      body: `## Portfolio result\n\n| Idea | Recommendation | Visitor→Lead | Notes |\n|---|---|---|---|\n| Ledger | **GO** | 9.8% | Proceed to build, 34 warm leads |\n| Fleetwise | More data | 5.1% (social only) | Isolate paid social, re-test |\n| Homebase Pro | **NO-GO** | 1.9% | Kill; trust barrier, not awareness |\n| PitchDeck AI | More data | 2.4% (page) | Rewrite landing page to match email hook |\n\n## Recommendation\n\nMove Ledger directly into a Presale Sprint to convert warm leads into deposits ahead of build kickoff. Budget a 10-day follow-up test for PitchDeck AI. Archive Homebase Pro and Fleetwise-as-tested; Fleetwise may be worth a narrow re-test on paid social alone.\n\n## What this cost\n\n21 days, $2,340 in media spend across 4 ideas, one written report per idea plus this portfolio summary — versus the 4-6 months and $80k+ it would have cost to build all four and find out the same thing in market.`,
      publishedAt: daysAgo(20),
      createdAt: daysAgo(20),
    },
  });

  // ---------------------------------------------------------------------
  // Project B — the GO decision moving into an active Presale Sprint
  // ---------------------------------------------------------------------
  const projectB = await prisma.project.create({
    data: {
      organizationId: clientOrganization.id,
      name: "Ledger — Presale Sprint",
      package: PackageType.PRESALE_SPRINT,
      status: "TESTING",
      summary:
        "Converting the 34 warm leads from the Q2 validation batch into paid deposits ahead of build kickoff. Target: 25 deposits at $49 by Sept 15.",
      startDate: daysAgo(18),
      targetCompleteDate: daysAgo(-6),
      createdAt: daysAgo(19),
    },
  });

  const ideaB = await prisma.idea.create({
    data: {
      projectId: projectB.id,
      name: "Ledger",
      oneLiner: "AI bookkeeping built for solo landscaping & lawn care businesses.",
      hypothesis:
        "The 34 warm leads plus a wider landscaping-owner audience will pay a $49 refundable deposit to reserve founder pricing ahead of the product shipping.",
      targetCustomer: "Owner-operator landscaping & lawn care businesses, 1-5 employees, US.",
      priorityRank: 1,
      status: "TESTING",
      landingPageUrl: "https://get.kpindicator.co/ledger-presale",
      createdAt: daysAgo(18),
    },
  });

  const campaignB1 = await prisma.campaign.create({
    data: {
      ideaId: ideaB.id,
      channel: Channel.EMAIL,
      name: "Ledger — warm list deposit push",
      status: "LIVE",
      budgetCents: 0,
      startDate: daysAgo(18),
    },
  });
  const campaignB2 = await prisma.campaign.create({
    data: {
      ideaId: ideaB.id,
      channel: Channel.PAID_SOCIAL,
      name: "Ledger — cold lookalike deposit push",
      status: "LIVE",
      budgetCents: 180000,
      startDate: daysAgo(14),
    },
  });

  for (let d = 18; d >= 0; d -= 2) {
    await prisma.metricSnapshot.create({
      data: {
        campaignId: campaignB1.id,
        date: daysAgo(d),
        visitors: int(20, 45),
        leads: int(8, 18),
        signups: int(2, 6),
        preorders: int(1, 4),
        spendCents: 0,
      },
    });
  }
  for (let d = 14; d >= 0; d -= 2) {
    await prisma.metricSnapshot.create({
      data: {
        campaignId: campaignB2.id,
        date: daysAgo(d),
        visitors: int(140, 260),
        leads: int(10, 26),
        signups: int(3, 9),
        preorders: int(0, 3),
        spendCents: int(9000, 22000),
      },
    });
  }

  // ---------------------------------------------------------------------
  // Orders (Stripe payment history)
  // ---------------------------------------------------------------------
  await prisma.order.create({
    data: {
      organizationId: clientOrganization.id,
      package: PackageType.VALIDATION_SPRINT,
      amountCents: 490000,
      status: "PAID",
      stripeSessionId: "cs_demo_validation_sprint",
      createdAt: daysAgo(53),
    },
  });
  await prisma.order.create({
    data: {
      organizationId: clientOrganization.id,
      package: PackageType.PRESALE_SPRINT,
      amountCents: 850000,
      status: "PAID",
      stripeSessionId: "cs_demo_presale_sprint",
      createdAt: daysAgo(19),
    },
  });

  // ---------------------------------------------------------------------
  // Outbound marketing email campaigns (KPIndicator's own, not a client's)
  // ---------------------------------------------------------------------
  const emailCampaignCount = await seedEmailCampaigns();

  console.log(`Seeded users: ${admin.email}, ${client.email}`);
  console.log(`Seeded projects: ${projectA.name}, ${projectB.name}`);
  console.log(`Seeded email campaigns: ${emailCampaignCount}`);
}

const hoursAfter = (date: Date, h: number) => new Date(date.getTime() + h * 3600_000);

type RecipientOutcome =
  | "bounced"
  | "unsubscribed"
  | "clicked"
  | "opened"
  | "delivered"
  | "sent"
  | "pending";

async function seedRecipient({
  campaignId,
  email,
  name,
  company,
  outcome,
  sentDaysAgo,
}: {
  campaignId: string;
  email: string;
  name: string;
  company?: string;
  outcome: RecipientOutcome;
  sentDaysAgo: number;
}) {
  if (outcome === "pending") {
    return prisma.emailRecipient.create({
      data: { campaignId, email, name, company, status: "PENDING" },
    });
  }

  const sentAt = daysAgo(sentDaysAgo);
  const events: { type: EmailEventType; occurredAt: Date; url?: string }[] = [
    { type: EmailEventType.SENT, occurredAt: sentAt },
  ];

  // Each branch builds exactly the event trail for its outcome and returns
  // immediately — no fallthrough, so a "sent"-only recipient can't
  // accidentally pick up opens/clicks from a later branch.
  if (outcome === "sent") {
    return createRecipientFromEvents({ campaignId, email, name, company, status: EmailRecipientStatus.SENT, events });
  }

  if (outcome === "bounced") {
    events.push({ type: EmailEventType.BOUNCED, occurredAt: hoursAfter(sentAt, int(0, 2)) });
    return createRecipientFromEvents({ campaignId, email, name, company, status: EmailRecipientStatus.BOUNCED, events });
  }

  events.push({ type: EmailEventType.DELIVERED, occurredAt: hoursAfter(sentAt, int(0, 1)) });

  if (outcome === "delivered") {
    return createRecipientFromEvents({ campaignId, email, name, company, status: EmailRecipientStatus.DELIVERED, events });
  }

  const openCount = int(1, 3);
  for (let i = 0; i < openCount; i++) {
    events.push({ type: EmailEventType.OPENED, occurredAt: hoursAfter(sentAt, int(2, 96) + i * 20) });
  }

  if (outcome === "unsubscribed") {
    events.push({ type: EmailEventType.UNSUBSCRIBED, occurredAt: hoursAfter(sentAt, int(96, 120)) });
    return createRecipientFromEvents({ campaignId, email, name, company, status: EmailRecipientStatus.UNSUBSCRIBED, events });
  }

  if (outcome === "opened") {
    return createRecipientFromEvents({ campaignId, email, name, company, status: EmailRecipientStatus.OPENED, events });
  }

  const clickCount = int(1, 2);
  for (let i = 0; i < clickCount; i++) {
    events.push({
      type: EmailEventType.CLICKED,
      occurredAt: hoursAfter(sentAt, int(3, 100) + i * 5),
      url: "https://kpindicator.co/pricing",
    });
  }

  return createRecipientFromEvents({ campaignId, email, name, company, status: EmailRecipientStatus.CLICKED, events });
}

async function createRecipientFromEvents({
  campaignId,
  email,
  name,
  company,
  status,
  events,
}: {
  campaignId: string;
  email: string;
  name: string;
  company?: string;
  status: EmailRecipientStatus;
  events: { type: EmailEventType; occurredAt: Date; url?: string }[];
}) {
  const sent = events.find((e) => e.type === "SENT");
  const delivered = events.find((e) => e.type === "DELIVERED");
  const opens = events.filter((e) => e.type === "OPENED");
  const clicks = events.filter((e) => e.type === "CLICKED");
  const bounced = events.find((e) => e.type === "BOUNCED");
  const unsubscribed = events.find((e) => e.type === "UNSUBSCRIBED");

  const recipient = await prisma.emailRecipient.create({
    data: {
      campaignId,
      email,
      name,
      company,
      status,
      sentAt: sent?.occurredAt,
      deliveredAt: delivered?.occurredAt,
      firstOpenedAt: opens[0]?.occurredAt,
      lastOpenedAt: opens.at(-1)?.occurredAt,
      openCount: opens.length,
      firstClickedAt: clicks[0]?.occurredAt,
      lastClickedAt: clicks.at(-1)?.occurredAt,
      clickCount: clicks.length,
      bouncedAt: bounced?.occurredAt,
      bounceReason: bounced ? "mailbox_full" : undefined,
      unsubscribedAt: unsubscribed?.occurredAt,
    },
  });

  for (const event of events) {
    await prisma.emailEvent.create({
      data: {
        recipientId: recipient.id,
        type: event.type,
        occurredAt: event.occurredAt,
        url: event.url,
      },
    });
  }

  return recipient;
}

async function seedEmailCampaigns() {
  const sentCampaign = await prisma.emailCampaign.create({
    data: {
      name: "Founding Cohort Outreach — Batch 1",
      subject: "Test it before you build it (founding pricing inside)",
      previewText: "We validate 3-5 of your ideas with real traffic before you write a line of code.",
      fromName: "Sam at KPIndicator",
      fromEmail: "sam@kpindicator.co",
      audience: "Cold list — 16 startup studio & solo founder contacts (AngelList + LinkedIn export)",
      status: "SENT",
      sentAt: daysAgo(12),
      createdAt: daysAgo(13),
    },
  });

  const batch1: Array<[string, string, string | undefined, RecipientOutcome]> = [
    ["Priya Shah", "priya@northlightstudio.io", "Northlight Studio", "clicked"],
    ["Marcus Webb", "marcus@fieldnoteventures.com", "Fieldnote Ventures", "clicked"],
    ["Alex Kim", "alex@driftlab.co", "Drift Lab", "opened"],
    ["Dana Ruiz", "dana@basecampstudio.dev", "Basecamp Studio", "opened"],
    ["Owen Baxter", "owen@ridgelineholdings.com", "Ridgeline Holdings", "opened"],
    ["Elena Fischer", "elena@greenhouseworks.io", "Greenhouse Works", "delivered"],
    ["Ravi Patel", "ravi@forgestudio.co", "Forge Studio", "delivered"],
    ["Nadia Okafor", "nadia@parallelventures.com", "Parallel Ventures", "delivered"],
    ["Tom Bellweather", "tom@tomweather.example", undefined, "bounced"],
    ["Grace Lindqvist", "grace@lindqvistlabs.io", "Lindqvist Labs", "sent"],
    ["Jules Moreau", "jules@moreaubuilds.com", "Moreau Builds", "sent"],
    ["Hannah Voss", "hannah@vossstudio.co", "Voss Studio", "sent"],
    ["Théo Bernard", "theo@bernardventures.fr", "Bernard Ventures", "unsubscribed"],
    ["Casey Nolan", "casey@nolanandco.com", "Nolan & Co", "clicked"],
    ["Iris Halvorsen", "iris@halvorsenstudio.no", "Halvorsen Studio", "opened"],
    ["Ben Ortega", "ben@ortegaholdings.com", "Ortega Holdings", "sent"],
  ];

  for (const [name, email, company, outcome] of batch1) {
    await seedRecipient({ campaignId: sentCampaign.id, email, name, company, outcome, sentDaysAgo: 12 });
  }

  const followUpCampaign = await prisma.emailCampaign.create({
    data: {
      name: "Case Study Follow-up — Corporate Innovation",
      subject: "How one team killed 2 of 3 internal bets before the board meeting",
      previewText: "A steering-committee decision that took 19 minutes instead of 90.",
      fromName: "Sam at KPIndicator",
      fromEmail: "sam@kpindicator.co",
      audience: "Warm list — corporate innovation leads who downloaded the process one-pager",
      status: "SENT",
      sentAt: daysAgo(3),
      createdAt: daysAgo(4),
    },
  });

  const batch2: Array<[string, string, string | undefined, RecipientOutcome]> = [
    ["Whitney Chao", "whitney@meridianlogistics.com", "Meridian Logistics", "clicked"],
    ["Derek Sano", "derek@ironbridgegroup.com", "Ironbridge Group", "opened"],
    ["Fatima Al-Rashid", "fatima@novacoreindustries.com", "Novacore Industries", "opened"],
    ["Liam O'Connell", "liam@brightpathco.com", "Brightpath Co", "delivered"],
    ["Sofia Marchetti", "sofia@atlasinnovate.com", "Atlas Innovate", "delivered"],
    ["Chidi Eze", "chidi@vantagepointgrp.com", "Vantage Point Group", "sent"],
    ["Renee Dupuis", "renee@keystoneworks.com", "Keystone Works", "sent"],
    ["Marcus Webb", "marcus.w@meridianlogistics.com", "Meridian Logistics", "sent"],
  ];

  for (const [name, email, company, outcome] of batch2) {
    await seedRecipient({ campaignId: followUpCampaign.id, email, name, company, outcome, sentDaysAgo: 3 });
  }

  // A draft, not sent yet — shows the pre-send state in the admin UI.
  const draftCampaign = await prisma.emailCampaign.create({
    data: {
      name: "Q3 Newsletter — Draft",
      subject: "What we learned testing 40 ideas this quarter",
      audience: "Full list — all past contacts + newsletter opt-ins",
      status: "DRAFT",
      createdAt: daysAgo(1),
    },
  });
  await prisma.emailRecipient.create({
    data: { campaignId: draftCampaign.id, email: "priya@northlightstudio.io", name: "Priya Shah", company: "Northlight Studio", status: "PENDING" },
  });

  return 3;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
