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
    reminders: false,
    cloudSync: false,
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
  { label: "Payment reminders", free: false, pro: "Coming soon" },
  { label: "Cloud sync across devices", free: false, pro: "Coming soon" },
  { label: "Priority support", free: false, pro: true },
];
