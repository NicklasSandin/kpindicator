import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const bodySchema = z.object({
  audience: z.enum(["STARTUP", "INVESTOR", "EXPLORER"]),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "Verify your email first." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick one of the options." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { audience: parsed.data.audience },
  });

  return NextResponse.json({ ok: true, redirect: "/dashboard" });
}
