import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

const GENERIC_ERROR = "That email and password don't match an account.";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await createSession(user.id);

  const redirectTo = user.role === "ADMIN" ? "/admin" : !user.audience ? "/onboarding" : "/dashboard";
  return NextResponse.json({ ok: true, redirect: redirectTo });
}
