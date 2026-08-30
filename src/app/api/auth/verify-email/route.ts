import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { hashVerificationToken } from "@/lib/email-verification";

const bodySchema = z.object({ token: z.string().min(32).max(200) });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to verify your email." }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, redirect: user.audience ? "/dashboard" : "/onboarding" });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashVerificationToken(parsed.data.token) },
  });
  if (!verification || verification.userId !== user.id) {
    return NextResponse.json({ error: "This verification link is invalid or belongs to another account." }, { status: 400 });
  }
  if (verification.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: verification.id } });
    return NextResponse.json({ error: "This verification link has expired. Request a new one." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
  ]);
  return NextResponse.json({ ok: true, redirect: user.audience ? "/dashboard" : "/onboarding" });
}
