export interface IncorporatePackage {
  id: "formation-basics" | "formation-plus" | "full-setup";
  name: string;
  tagline: string;
  description: string;
  includes: string[];
  featured?: boolean;
}

export const INCORPORATE_PACKAGES: IncorporatePackage[] = [
  {
    id: "formation-basics",
    name: "Formation Basics",
    tagline: "The entity itself, done correctly the first time.",
    description:
      "Entity formation, filed and registered properly, so you have a legal structure to operate under and eventually take money through.",
    includes: [
      "Entity formation & state/registry filing",
      "EIN / tax ID registration",
      "Registered agent for year one",
      "Operating agreement or bylaws template",
    ],
  },
  {
    id: "formation-plus",
    name: "Formation + Banking",
    tagline: "Ready to actually take money, not just exist on paper.",
    description:
      "Everything in Formation Basics, plus what you need to open a business bank account and keep ownership clean from day one.",
    includes: [
      "Everything in Formation Basics",
      "Business bank account setup support",
      "Cap table setup",
      "Founder / co-founder agreement",
    ],
    featured: true,
  },
  {
    id: "full-setup",
    name: "Full Company Setup",
    tagline: "Formation, banking, and the compliance calendar so nothing lapses.",
    description:
      "For teams who want this fully off their plate — the entity, the banking, and a year of the paperwork that's easy to forget until it's overdue.",
    includes: [
      "Everything in Formation + Banking",
      "Contractor & employee agreement templates",
      "Annual compliance calendar & reminders",
      "Ongoing registered agent, first 12 months",
    ],
  },
];

export const INCORPORATE_FOR_YOU = [
  {
    title: "A validated idea that's ready to take money",
    detail: "You cleared a go signal — a Presale Sprint deposit, a booked contract — and now need a real entity to receive it.",
    icon: "badge-check",
  },
  {
    title: "Founders who haven't incorporated yet",
    detail: "You're operating as a person, not a company, and it's starting to matter — for liability, for banking, for who owns what.",
    icon: "building-2",
  },
  {
    title: "Studios spinning a portfolio idea into its own entity",
    detail: "An idea validated inside your portfolio needs to become its own company, cleanly separated from the parent.",
    icon: "layers",
  },
  {
    title: "Teams who'd rather bundle this with their validation partner",
    detail: "Instead of a separate law firm relationship for a one-time filing, get it handled by the team that already knows the business.",
    icon: "briefcase",
  },
] as const;

export const INCORPORATE_FAQS = [
  {
    question: "Do I need to have validated my idea first?",
    answer:
      "No — plenty of clients come to us for formation on its own. But if you haven't tested demand yet, we'll usually suggest starting there first; there's no reason to pay for a company structure before you know there's a business to put inside it.",
  },
  {
    question: "What entity types do you set up?",
    answer:
      "Most commonly an LLC or a C-Corp, depending on whether you're planning to raise outside capital, issue equity to a team, or just need a clean liability shield for a straightforward business. We'll walk through which one actually fits your plan on the call — it's rarely as obvious as it looks online.",
  },
  {
    question: "Is this a law firm? Are you giving legal advice?",
    answer:
      "We're a formation and setup service, not a law firm, and this isn't a substitute for legal advice on anything beyond standard formation. For anything with real legal complexity — investor terms, IP disputes, unusual ownership structures — we'll tell you directly when it's time to bring in outside counsel.",
  },
  {
    question: "How long does formation actually take?",
    answer:
      "Filing itself is usually fast once we have your details — often a matter of days. EIN issuance, banking setup, and registered agent activation can add a couple of weeks depending on the jurisdiction and your bank. We'll give you a specific timeline on the call before anything starts.",
  },
  {
    question: "Can you handle this if I'm not based in the US?",
    answer:
      "Talk to us about your specific situation — the right structure depends heavily on where you and your business are actually based. We'll tell you plainly if your case is outside what we handle directly.",
  },
] as const;
