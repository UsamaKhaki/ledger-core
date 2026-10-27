export type Plan = "free" | "pro";

export type Limits = {
  maxDebts: number; // Infinity for unlimited
  amortizationTable: boolean;
  csvExport: boolean;
  strategyComparison: boolean;
  whatIf: boolean;
  reminders: boolean;
  cloudSync: boolean;
};

export const LIMITS: Record<Plan, Limits> = {
  free: {
    maxDebts: 3,
    amortizationTable: false,
    csvExport: false,
    strategyComparison: true,
    whatIf: true,
    // Emailed due-date reminders + the weekly summary are a Pro feature,
    // enforced in the reminders cron (not just hidden in the UI).
    reminders: false,
    // Anyone with an account gets their data stored and synced server-side —
    // that is inherent to signing in, so it cannot honestly be sold as Pro.
    cloudSync: true,
  },
  pro: {
    maxDebts: Infinity,
    amortizationTable: true,
    csvExport: true,
    strategyComparison: true,
    whatIf: true,
    reminders: true,
    cloudSync: true,
  },
};

export const FREE_DEBT_LIMIT = LIMITS.free.maxDebts;

// Pricing (USD). Yearly is billed once/year; monthly-equivalent shown in UI.
export const PRICING = {
  monthlyPrice: 6,
  yearlyPrice: 48, // => $4/mo, ~33% off
  currency: "USD",
} as const;

export const yearlyMonthlyEquivalent = PRICING.yearlyPrice / 12; // 4
export const yearlySavingsPct = Math.round(
  (1 - PRICING.yearlyPrice / (PRICING.monthlyPrice * 12)) * 100,
); // 33

export type Feature = {
  label: string;
  free: boolean | string;
  pro: boolean | string;
};

// Marketing / pricing comparison table (source of truth for both pages).
export const FEATURE_MATRIX: Feature[] = [
  { label: "Debts tracked", free: "Up to 3", pro: "Unlimited" },
  { label: "Avalanche & Snowball strategies", free: true, pro: true },
  { label: "Strategy comparison", free: true, pro: true },
  { label: "Extra-payment what-if slider", free: true, pro: true },
  { label: "Balance-over-time chart", free: true, pro: true },
  { label: "Log payments & progress tracking", free: true, pro: true },
  { label: "Milestone celebrations", free: true, pro: true },
  { label: "Full amortization schedule", free: false, pro: true },
  { label: "Export plan to CSV", free: false, pro: true },
  { label: "Email payment reminders", free: false, pro: true },
  { label: "Weekly progress email", free: false, pro: true },
  { label: "Cloud sync across devices", free: true, pro: true },
  { label: "Priority support", free: false, pro: true },
];

// Stripe subscription statuses that keep Pro on. Anything else (past_due,
// canceled, unpaid, incomplete, ...) falls back to free.
export function isEntitledStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

type ProfileBilling = {
  plan?: string | null;
  subscription_status?: string | null;
};

/** Server-truth plan check against a profile row mirrored by the Stripe webhook. */
export function isProProfile(profile: ProfileBilling | null | undefined): boolean {
  return profile?.plan === "pro" && isEntitledStatus(profile.subscription_status);
}

/**
 * Emailed reminders are a Pro feature, enforced where the send happens.
 *
 * Without Stripe the app runs in local-simulation billing mode (see
 * `subscription.tsx`), where no profile is ever marked "pro", so the gate is
 * off rather than silently emailing no one.
 */
export function remindersAllowed(
  profile: ProfileBilling,
  stripeConfigured: boolean,
): boolean {
  if (!stripeConfigured) return true;
  return LIMITS[isProProfile(profile) ? "pro" : "free"].reminders;
}
