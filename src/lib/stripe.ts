import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazily constructed so the app can boot without a Stripe key in dev/demo. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.endsWith("...")) return null;
  if (!_stripe) {
    _stripe = new Stripe(key);
  }
  return _stripe;
}
