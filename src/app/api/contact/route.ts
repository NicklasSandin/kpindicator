import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/notify";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  interest: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  currentStage: z.string().max(100).optional(),
  targetCustomer: z.string().min(2).max(1000),
  priorTests: z.string().max(2000).optional(),
  budget: z.string().max(100).optional(),
  timeline: z.string().max(100).optional(),
  // Honeypot field — real users never fill this in.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(`contact:${requestIp(req.headers)}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const { website, ...data } = parsed.data;
  if (website) {
    // Bot filled the honeypot — pretend success, do nothing.
    return NextResponse.json({ ok: true });
  }

  await prisma.contactSubmission.create({ data });

  await notifyAdmin(
    `New contact inquiry from ${data.name}`,
    `${data.name} <${data.email}>${data.company ? ` (${data.company})` : ""}${data.interest ? ` — ${data.interest}` : ""}\n\nIdea: ${data.message}\n\nTarget customer: ${data.targetCustomer}\nStage: ${data.currentStage || "Not provided"}\nPrior tests: ${data.priorTests || "None provided"}\nBudget: ${data.budget || "Not provided"}\nTimeline: ${data.timeline || "Not provided"}`,
  );

  return NextResponse.json({ ok: true });
}
