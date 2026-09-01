import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Inbox,
  Lightbulb,
  Mail,
  MessageSquareText,
  MousePointerClick,
  PauseCircle,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: { absolute: "How KPIndicator Works — KPIndicator Admin" },
};

type FlowStep = {
  number: string;
  title: string;
  description: string;
  evidence: string;
  icon: LucideIcon;
};

const ACQUISITION_STEPS: FlowStep[] = [
  {
    number: "01",
    title: "Reach the right founder",
    description: "A short, personal email introduces one idea: test demand before funding the build.",
    evidence: "Reply, click, or idea-review request",
    icon: Mail,
  },
  {
    number: "02",
    title: "Review the idea",
    description: "We learn the proposed buyer, current stage, prior tests, budget, and decision deadline.",
    evidence: "Qualified inquiry in the admin inbox",
    icon: Inbox,
  },
  {
    number: "03",
    title: "Choose the proof level",
    description: "The decision determines the package: research, one market test, a multi-idea sprint, or presale proof.",
    evidence: "Agreed scope, threshold, and package",
    icon: CircleDollarSign,
  },
];

const VALIDATION_STEPS: FlowStep[] = [
  {
    number: "04",
    title: "Turn the idea into an offer",
    description: "Define the buyer, urgent problem, promise, price, and the action that would count as real intent.",
    evidence: "Testable offer and pre-agreed threshold",
    icon: Lightbulb,
  },
  {
    number: "05",
    title: "Launch the demand test",
    description: "Build the landing page and bring qualified prospects through paid traffic, email, or direct outreach.",
    evidence: "Live page, tracked channels, real prospects",
    icon: Rocket,
  },
  {
    number: "06",
    title: "Measure behavior",
    description: "Separate weak attention from stronger actions: visits, leads, replies, qualified steps, bookings, and deposits.",
    evidence: "Live dashboard and auditable metrics",
    icon: BarChart3,
  },
  {
    number: "07",
    title: "Qualify the signal",
    description: "Talk to people who raised their hand and learn why they acted, what they expected, and what blocked purchase.",
    evidence: "Buyer language, objections, and qualification",
    icon: MessageSquareText,
  },
  {
    number: "08",
    title: "Make the decision",
    description: "Compare the result with the threshold agreed before launch and publish the evidence with a direct recommendation.",
    evidence: "Go, pivot, no-go, or more-data report",
    icon: FileCheck2,
  },
];

const SIGNALS = [
  { label: "Attention", examples: "Opens and visits", strength: "Weak", icon: MousePointerClick },
  { label: "Interest", examples: "Replies and leads", strength: "Useful", icon: Users },
  { label: "Intent", examples: "Qualified calls and signups", strength: "Strong", icon: CheckCircle2 },
  { label: "Commitment", examples: "Deposits and preorders", strength: "Strongest", icon: ShieldCheck },
];

export default function AdminExplainerPage() {
  return (
    <div className="mx-auto max-w-6xl pb-12">
      <div className="max-w-3xl">
        <Badge variant="secondary">Operating flow</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          How KPIndicator turns an idea into a decision
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          The business has one continuous flow: attract founders with a simple validation angle,
          run a controlled demand test, and make the build decision from buyer behavior—not opinion.
        </p>
      </div>

      <section className="mt-10">
        <FlowLabel number="A" title="Acquire and qualify" detail="From first contact to an agreed validation scope" />
        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr] xl:items-stretch">
          {ACQUISITION_STEPS.map((step, index) => (
            <FlowCardWithArrow key={step.number} step={step} showArrow={index < ACQUISITION_STEPS.length - 1} />
          ))}
        </div>
      </section>

      <div className="my-7 flex justify-center text-primary"><ArrowDown className="size-6" /></div>

      <section>
        <FlowLabel number="B" title="Run the validation" detail="From a testable offer to decision-grade evidence" />
        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-stretch">
          {VALIDATION_STEPS.map((step, index) => (
            <FlowCardWithArrow key={step.number} step={step} showArrow={index < VALIDATION_STEPS.length - 1} />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">Signal ladder</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Not every conversion means demand</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            The report gives more weight to costly buyer actions. Opens are directional; money is commitment.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNALS.map((signal, index) => (
            <div key={signal.label} className="relative rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <signal.icon className="size-5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{index + 1} / 4</span>
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{signal.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{signal.examples}</p>
              <Badge variant={index >= 2 ? "default" : "outline"} className="mt-4">{signal.strength}</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <FlowLabel number="C" title="Act on the result" detail="The report must produce a next action, not another debate" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OutcomeCard icon={CheckCircle2} tone="go" title="Go" description="The idea cleared the threshold. Proceed to presale or build with the winning positioning." />
          <OutcomeCard icon={RefreshCcw} tone="pivot" title="Pivot" description="The problem has signal, but the current audience, offer, price, or framing needs a focused retest." />
          <OutcomeCard icon={XCircle} tone="stop" title="No-go" description="The idea missed the threshold. Stop before committing development budget." />
          <OutcomeCard icon={PauseCircle} tone="wait" title="More data" description="The result is genuinely unclear. Isolate the uncertainty and run the smallest useful follow-up." />
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="text-sm font-medium text-primary">The complete promise</p>
        <p className="mx-auto mt-2 max-w-3xl text-xl font-semibold text-foreground sm:text-2xl">
          Spend a little to learn what buyers do before spending a lot to build what they may not want.
        </p>
      </div>
    </div>
  );
}

function FlowLabel({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{number}</span>
      <div><h2 className="font-semibold text-foreground">{title}</h2><p className="text-sm text-muted-foreground">{detail}</p></div>
    </div>
  );
}

function FlowCardWithArrow({ step, showArrow }: { step: FlowStep; showArrow: boolean }) {
  return <>
    <article className="flex min-h-52 flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold text-primary">{step.number}</span><step.icon className="size-5 text-primary" /></div>
      <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
      <div className="mt-auto border-t border-border pt-4"><p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Proof produced</p><p className="mt-1 text-xs font-medium text-foreground">{step.evidence}</p></div>
    </article>
    {showArrow && <div className="flex items-center justify-center py-1 text-muted-foreground"><ArrowDown className="size-5 xl:hidden" /><ArrowRight className="hidden size-5 xl:block" /></div>}
  </>;
}

function OutcomeCard({ icon: Icon, tone, title, description }: { icon: LucideIcon; tone: "go" | "pivot" | "stop" | "wait"; title: string; description: string }) {
  const tones = {
    go: "border-status-go/30 bg-status-go/5 text-status-go",
    pivot: "border-primary/30 bg-primary/5 text-primary",
    stop: "border-destructive/30 bg-destructive/5 text-destructive",
    wait: "border-status-testing/30 bg-status-testing/5 text-status-testing",
  };
  return <article className={`rounded-xl border p-5 ${tones[tone]}`}><Icon className="size-6" /><h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>;
}
