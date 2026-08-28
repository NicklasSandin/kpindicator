import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/notify";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form — name, a valid email, and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try logging in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "CLIENT" },
  });

  await createSession(user.id);
  await notifyAdmin("New KPIndicator signup", `${name} <${email}> just created an account.`);

  return NextResponse.json({ ok: true, redirect: "/onboarding" });
}
