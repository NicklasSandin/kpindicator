import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ORGANIZATION_COOKIE } from "@/lib/organization";

const bodySchema = z.object({ organizationId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!user.emailVerifiedAt) return NextResponse.json({ error: "Verify your email first." }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid team." }, { status: 400 });

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: parsed.data.organizationId, userId: user.id } },
  });
  if (!membership) return NextResponse.json({ error: "You do not belong to that team." }, { status: 403 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ORGANIZATION_COOKIE, membership.organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
