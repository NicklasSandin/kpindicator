import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ORGANIZATION_COOKIE } from "@/lib/organization";

const bodySchema = z.object({ name: z.string().trim().min(2).max(100) });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a team name between 2 and 100 characters." }, { status: 400 });

  const organization = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      members: { create: { userId: user.id, role: "OWNER" } },
      auditLogs: { create: { actorId: user.id, actorName: user.name, action: "TEAM_CREATED", target: parsed.data.name } },
    },
  });

  const response = NextResponse.json({ ok: true, organizationId: organization.id });
  response.cookies.set(ORGANIZATION_COOKIE, organization.id, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
