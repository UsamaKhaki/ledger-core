// GDPR account operations: export everything we hold about a user, and fully
// delete their account + data. Spans auth + data + billing, so it lives in its
// own service rather than the auth provider.

import { auth } from "@/lib/auth";
import { data } from "@/lib/api/data";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import type { AuthUser } from "@/lib/auth/types";
import type { Debt, Payment } from "@/lib/types";

export type ExportBundle = {
  exportedAt: string;
  account: AuthUser;
  debts: Debt[];
  payments: Payment[];
};

export const account = {
  async export(): Promise<ExportBundle | null> {
    const user = await auth.getUser();
    if (!user) return null;
    const [debts, payments] = await Promise.all([
      data.listDebts(),
      data.listPayments(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      account: user,
      debts,
      payments,
    };
  },

  async remove(): Promise<{ error: string | null; notSignedIn?: boolean }> {
    const user = await auth.getUser();
    if (!user) return { error: "You're not signed in.", notSignedIn: true };

    if (isSupabaseConfigured()) {
      const sb = await supabaseServer();
      const {
        data: { user: sbUser },
      } = await sb.auth.getUser();
      if (!sbUser) return { error: "You're not signed in.", notSignedIn: true };

      // Best-effort: delete the Stripe customer first — this cancels any active
      // subscription and erases their billing data on Stripe's side.
      if (stripe) {
        try {
          const { data: profile } = await sb
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", sbUser.id)
            .single();
          const cid = profile?.stripe_customer_id as string | null | undefined;
          if (cid) await stripe.customers.del(cid);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          console.error("[account.remove] stripe cleanup failed:", msg);
          // continue — account deletion still proceeds
        }
      }

      // Deletes the auth user; ON DELETE CASCADE removes the profile, debts,
      // and payments tied to their user_id.
      const { error } = await supabaseAdmin().auth.admin.deleteUser(sbUser.id);
      if (error) return { error: error.message };

      await auth.signOut(); // clear the session cookie
      return { error: null };
    }

    // Mock/dev: clear in-memory data and end the session.
    await data.clear();
    await auth.signOut();
    return { error: null };
  },
};
