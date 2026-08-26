import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getStripe } from "@/lib/stripe";
import { PACKAGES, type PackageId } from "@/content/packages";

const bodySchema = z.object({
  packageId: z.enum(["idea-check", "market-test", "validation-sprint", "presale-sprint"] as [
    PackageId,
    ...PackageId[],
  ]),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const pkg = PACKAGES.find((p) => p.id === parsed.data.packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Unknown package." }, { status: 400 });
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!stripe) {
    // Stripe isn't configured yet (no secret key in env) — this keeps the
    // flow demoable end to end. Wire STRIPE_SECRET_KEY to go live.
    return NextResponse.json(
      {
        error:
          "Payments aren't configured yet. Set STRIPE_SECRET_KEY in .env to enable checkout.",
      },
      { status: 501 },
    );
  }

  const priceId = process.env[pkg.stripePriceEnvVar];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: parsed.data.email,
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: pkg.priceCents,
              product_data: {
                name: pkg.name,
                description: pkg.tagline,
              },
            },
          },
    ],
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/pricing`,
    metadata: { packageId: pkg.id },
  });

  return NextResponse.json({ url: session.url });
}
