// Stripe webhook — the SOURCE OF TRUTH for subscription state. Stripe calls
// this on payment/subscription events; we verify the signature, then mirror the
// subscription onto the user's profile with the service-role key (bypassing
// RLS). This route must receive the RAW request body, so it lives outside the
// ts-rest handler (which parses JSON).

import type Stripe from "stripe";
import { stripe, billingForPrice } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// current_period_end moved onto subscription items in recent API versions;
// read it from the item first, then fall back to the (older) top-level field.
function periodEndISO(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as unknown as {
    current_period_end?: number;
  };
  const unix =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return typeof unix === "number" ? new Date(unix * 1000).toISOString() : null;
}

async function syncSubscription(customerId: string, sub: Stripe.Subscription) {
  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const active = sub.status === "active" || sub.status === "trialing";
  await supabaseAdmin()
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      plan: active ? "pro" : "free",
      billing: billingForPrice(priceId),
      subscription_status: sub.status,
      price_id: priceId,
      current_period_end: periodEndISO(sub),
    })
    .eq("stripe_customer_id", customerId);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return new Response("Billing not configured", { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[stripe/webhook] signature verification failed:", msg);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await syncSubscription(customerId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await syncSubscription(sub.customer as string, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabaseAdmin()
          .from("profiles")
          .update({
            plan: "free",
            billing: null,
            subscription_status: sub.status,
            price_id: null,
          })
          .eq("stripe_customer_id", sub.customer as string);
        break;
      }
      default:
        // ignore other event types
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[stripe/webhook] handler error (${event.type}):`, msg);
    // 500 tells Stripe to retry — the event wasn't successfully processed.
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
