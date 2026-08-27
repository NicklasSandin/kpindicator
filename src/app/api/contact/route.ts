import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/lib/notify";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  company: z.string().max(200).optional(),
  interest: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  // Honeypot field — real users never fill this in.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
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

  const submission = await prisma.contactSubmission.create({ data });

  await notifyAdmin(
    `New contact inquiry from ${data.name}`,
    `${data.name} <${data.email}>${data.company ? ` (${data.company})` : ""}${data.interest ? ` — ${data.interest}` : ""}\n\n${data.message}`,
  );

  return NextResponse.json({ ok: true });
}
