import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email-verification";

const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ error: "Your email is already verified." }, { status: 409 });

  const latest = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
    return NextResponse.json({ error: `Wait ${retryAfter} seconds before requesting another email.` }, { status: 429 });
  }

  const result = await sendVerificationEmail(user);
  if (!result.delivered) {
    return NextResponse.json({ error: "The email service is temporarily unavailable. Please try again later." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
