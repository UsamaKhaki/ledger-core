// Server-side billing operations. Checkout + portal go through Stripe (hosted
// pages); status reads the server-truth plan from the user's profile row.
// When Stripe isn't configured, `status` reports configured:false so the app
// falls back to local simulation for development.

import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  stripe,
  isStripeConfigured,
  priceFor,
  siteBase,
} from "@/lib/stripe/server";
import { isProProfile } from "@/lib/tiers";

export type BillingStatus = {
  configured: boolean;
  plan: "free" | "pro";
  isPro: boolean;
  billing?: "monthly" | "yearly" | null;
  status?: string | null;
  currentPeriodEnd?: string | null;
};

type UrlResult = { url?: string; error?: string; status: 200 | 400 | 401 };

export const billing = {
  async status(): Promise<BillingStatus> {
    if (!isStripeConfigured()) {
      return { configured: false, plan: "free", isPro: false };
    }
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { configured: true, plan: "free", isPro: false };

    const { data: p } = await sb
      .from("profiles")
      .select("plan,billing,subscription_status,current_period_end")
      .eq("id", user.id)
      .single();

    const isPro = isProProfile(p);
    return {
      configured: true,
      plan: isPro ? "pro" : "free",
      isPro,
      billing: (p?.billing as "monthly" | "yearly" | null) ?? null,
      status: p?.subscription_status ?? null,
      currentPeriodEnd: p?.current_period_end ?? null,
    };
  },

  async checkout(userBilling: "monthly" | "yearly"): Promise<UrlResult> {
    if (!stripe || !isStripeConfigured()) {
      return { error: "Billing isn't set up yet.", status: 400 };
    }
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { error: "Sign in to upgrade.", status: 401 };

    const price = priceFor(userBilling);
    if (!price) return { error: "That plan isn't available.", status: 400 };

    // Reuse the customer if we've created one, otherwise create + remember it.
    const { data: profile } = await sb
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    let customerId = profile?.stripe_customer_id as string | null | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin()
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const base = siteBase();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${base}/app?upgraded=1`,
      cancel_url: `${base}/pricing?canceled=1`,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      metadata: { supabase_user_id: user.id },
    });
    if (!session.url) return { error: "Could not start checkout.", status: 400 };
    return { url: session.url, status: 200 };
  },

  async portal(): Promise<UrlResult> {
    if (!stripe || !isStripeConfigured()) {
      return { error: "Billing isn't set up yet.", status: 400 };
    }
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { error: "Sign in to manage billing.", status: 401 };

    const { data: profile } = await sb
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();
    const customerId = profile?.stripe_customer_id as string | null | undefined;
    if (!customerId) return { error: "No billing account found.", status: 400 };

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteBase()}/settings`,
    });
    return { url: session.url, status: 200 };
  },
};
