// Request-time guards that need server context (session, plan, current data).
// Pure payload validation lives in `./validate`.

import { auth } from "@/lib/auth";
import { data } from "@/lib/api/data";
import { isStripeConfigured } from "@/lib/stripe/server";
import { billing } from "@/lib/api/billing";
import { LIMITS } from "@/lib/tiers";
import type { AuthUser } from "@/lib/auth/types";

export { validateDebtInput, validatePayment, type Validated } from "./validate";

/** Resolve the caller, or null when there's no session. */
export async function currentUser(): Promise<AuthUser | null> {
  return auth.getUser();
}

/**
 * Server-side enforcement of the free plan's debt cap. The dashboard checks
 * this too, but a client-side check is a suggestion — without this, anyone can
 * POST past the paywall.
 *
 * Only enforced when Stripe is actually configured. Without it the app runs in
 * local-simulation billing mode (see `subscription.tsx`), where "Pro" lives in
 * localStorage and the server has no way to know the user upgraded.
 */
export async function debtLimitReached(): Promise<
  { reached: false } | { reached: true; error: string }
> {
  if (!isStripeConfigured()) return { reached: false };

  const status = await billing.status();
  const max = LIMITS[status.isPro ? "pro" : "free"].maxDebts;
  if (!Number.isFinite(max)) return { reached: false };

  const count = (await data.listDebts()).length;
  if (count < max) return { reached: false };

  return {
    reached: true,
    error: `The free plan tracks up to ${max} debts. Upgrade to Pro for unlimited.`,
  };
}
