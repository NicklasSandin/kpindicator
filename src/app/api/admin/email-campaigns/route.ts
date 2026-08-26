import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  previewText: z.string().max(300).optional(),
  fromName: z.string().max(200).optional(),
  fromEmail: z.string().email().optional().or(z.literal("")),
  audience: z.string().max(500).optional(),
  recipientsRaw: z.string().max(50_000),
});

/** Accepts one recipient per line: "Name <email@example.com>, Company" or a bare email. */
function parseRecipients(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [beforeComma, ...rest] = line.split(",");
      const company = rest.join(",").trim() || undefined;

      const bracketMatch = beforeComma.match(/^(.*)<([^<>]+)>$/);
      if (bracketMatch) {
        const name = bracketMatch[1].trim() || undefined;
        const email = bracketMatch[2].trim();
        return { name, email, company };
      }
      return { name: undefined, email: beforeComma.trim(), company };
    })
    .filter((r) => /\S+@\S+\.\S+/.test(r.email));
}

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const { recipientsRaw, fromEmail, ...data } = parsed.data;
  const recipients = parseRecipients(recipientsRaw);

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "Add at least one recipient (one per line, e.g. Name <email@example.com>)." },
      { status: 400 },
    );
  }

  // Recipients are unique per campaign — dedupe by email, keep first occurrence.
  const seen = new Set<string>();
  const deduped = recipients.filter((r) => {
    const key = r.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const campaign = await prisma.emailCampaign.create({
    data: {
      ...data,
      fromEmail: fromEmail || undefined,
      status: "DRAFT",
      recipients: { create: deduped.map((r) => ({ ...r, status: "PENDING" })) },
    },
  });

  return NextResponse.json({ id: campaign.id });
}
