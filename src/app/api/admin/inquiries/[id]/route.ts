import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getApiAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { captureServerEvent } from "@/lib/server-analytics";

const schema = z.object({ status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]) });

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getApiAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid inquiry status." }, { status: 400 });
  const { id } = await context.params;
  const inquiry = await prisma.contactSubmission.update({ where: { id }, data: { status: parsed.data.status } }).catch(() => null);
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
  if (parsed.data.status === "QUALIFIED") await captureServerEvent(inquiry.id, "qualified_lead_recorded", { interest: inquiry.interest || "unknown" });
  return NextResponse.json({ ok: true });
}
