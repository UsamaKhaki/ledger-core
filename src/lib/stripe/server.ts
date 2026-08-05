import Stripe from "stripe";

// Server-side Stripe client. Null when unconfigured so the app degrades
// gracefully (billing simply stays in "free"/local-simulation mode).
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Billing is only "live" when the secret key AND both price IDs are present.
export const isStripeConfigured = () =>
  !!process.env.STRIPE_SECRET_KEY &&
  !!process.env.STRIPE_PRICE_MONTHLY &&
  !!process.env.STRIPE_PRICE_YEARLY;

export function priceFor(billing: "monthly" | "yearly"): string | undefined {
  return billing === "yearly"
    ? process.env.STRIPE_PRICE_YEARLY
    : process.env.STRIPE_PRICE_MONTHLY;
}

export function billingForPrice(
  priceId: string | null | undefined,
): "monthly" | "yearly" | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_YEARLY) return "yearly";
  if (priceId && priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  return null;
}

export function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
