// One-time setup: create the "Ledger Pro" product + monthly/yearly prices in
// your Stripe account, then print the price IDs to paste into .env.local.
//
// Usage (test mode):
//   STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-products.mjs
//
// Safe to re-run: it reuses an existing "Ledger Pro" product and only creates a
// price if one with the same interval/amount doesn't already exist.

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("✗ Set STRIPE_SECRET_KEY, e.g.\n  STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-products.mjs");
  process.exit(1);
}
const stripe = new Stripe(key);

const NAME = "Ledger Pro";
const MONTHLY_CENTS = 600; // $6/mo
const YEARLY_CENTS = 4800; // $48/yr

async function findProduct() {
  const { data } = await stripe.products.list({ active: true, limit: 100 });
  return data.find((p) => p.name === NAME);
}

async function findPrice(productId, interval, amount) {
  const { data } = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  return data.find(
    (p) =>
      p.recurring?.interval === interval &&
      p.unit_amount === amount &&
      p.currency === "usd",
  );
}

async function ensurePrice(productId, interval, amount, nickname) {
  const existing = await findPrice(productId, interval, amount);
  if (existing) {
    console.log(`• reusing ${interval} price ${existing.id}`);
    return existing;
  }
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: amount,
    recurring: { interval },
    nickname,
  });
  console.log(`• created ${interval} price ${price.id}`);
  return price;
}

let product = await findProduct();
if (product) {
  console.log(`• reusing product ${product.id} (${NAME})`);
} else {
  product = await stripe.products.create({
    name: NAME,
    description:
      "Unlimited debts, full amortization schedule, CSV export, and priority support.",
  });
  console.log(`• created product ${product.id} (${NAME})`);
}

const monthly = await ensurePrice(product.id, "month", MONTHLY_CENTS, "Ledger Pro Monthly");
const yearly = await ensurePrice(product.id, "year", YEARLY_CENTS, "Ledger Pro Yearly");

console.log("\n✓ Done. Add these to .env.local:\n");
console.log(`STRIPE_PRICE_MONTHLY=${monthly.id}`);
console.log(`STRIPE_PRICE_YEARLY=${yearly.id}`);
console.log("");
