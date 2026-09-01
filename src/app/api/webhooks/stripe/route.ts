import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PACKAGES } from "@/content/packages";
import { notifyAdmin } from "@/lib/notify";

/**
 * Records a paid Order when Stripe confirms a Checkout Session.
 * Point your Stripe webhook endpoint (dashboard > Developers > Webhooks) at
 * POST /api/webhooks/stripe, subscribed to `checkout.session.completed`.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const rawSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const webhookSecret = rawSecret && !rawSecret.endsWith("...") ? rawSecret : undefined;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook isn't configured." },
      { status: 501 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const packageId = session.metadata?.packageId;
    const pkg = PACKAGES.find((p) => p.id === packageId);
    const email = session.customer_email ?? session.customer_details?.email;

    if (pkg && email) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: email.split("@")[0] },
      });

      let membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });
      if (!membership) {
        const organization = await prisma.organization.create({
          data: {
            name: `${user.name}'s team`,
            members: { create: { userId: user.id, role: "OWNER" } },
            auditLogs: {
              create: { actorId: user.id, actorName: user.name, action: "TEAM_CREATED", target: `${user.name}'s team` },
            },
          },
          include: { members: true },
        });
        membership = organization.members[0];
      }

      const existingOrder = await prisma.order.findUnique({
        where: { stripeSessionId: session.id },
      });

      await prisma.order.upsert({
        where: { stripeSessionId: session.id },
        update: { status: "PAID" },
        create: {
          organizationId: membership.organizationId,
          package: pkg.dbType,
          amountCents: session.amount_total ?? pkg.priceCents,
          currency: session.currency ?? "usd",
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          status: "PAID",
        },
      });

      if (!existingOrder) {
        const amount = ((session.amount_total ?? pkg.priceCents) / 100).toFixed(2);
        await notifyAdmin(
          `New paid signup: ${pkg.name}`,
          `${email} just paid $${amount} ${(session.currency ?? "usd").toUpperCase()} for ${pkg.name}.`,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
