"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSubscription } from "@/lib/subscription";
import { track } from "@/lib/analytics";
import {
  FEATURE_MATRIX,
  PRICING,
  yearlyMonthlyEquivalent,
  yearlySavingsPct,
} from "@/lib/tiers";
import { Card } from "@/components/ui";

export default function PricingPage() {
  const { isPro, upgrade, downgrade, billing } = useSubscription();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    track("view_pricing");
  }, []);

  function startCheckout() {
    // --- Stripe wiring point ---------------------------------------------
    // Production: POST to /api/checkout to create a Stripe Checkout Session for
    // the chosen price, then redirect to session.url. On success/webhook the
    // plan flips to "pro". For the scaffold we upgrade locally right away.
    track("checkout_started", { cycle });
    upgrade(cycle);
  }

  const price = cycle === "yearly" ? yearlyMonthlyEquivalent : PRICING.monthlyPrice;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 sm:py-16 lg:w-4/5">
      <header className="reveal mx-auto max-w-2xl text-center">
        <p className="kicker">Pricing</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          The planner is free forever. Upgrade to Pro when you want the full
          picture — cancel anytime.
        </p>

        {/* billing cycle toggle */}
        <div className="mt-7 inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                cycle === c
                  ? "bg-[var(--brand)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "yearly" ? (
                <span
                  className={`ml-1.5 text-[11px] ${
                    cycle === c ? "text-white/90" : "text-[var(--success)]"
                  }`}
                >
                  −{yearlySavingsPct}%
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {/* plan cards */}
      <div className="reveal mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {/* Free */}
        <Card className="flex flex-col p-6">
          <p className="font-display text-xl font-semibold">Free</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Everything you need to start.
          </p>
          <p className="font-display mt-5 text-4xl font-semibold tracking-tight">
            $0
          </p>
          <p className="text-xs text-[var(--muted)]">forever</p>
          <ul className="mt-5 flex-1 space-y-2 text-sm">
            {["Up to 3 debts", "Avalanche & Snowball", "Payoff chart & comparison", "Log payments & track progress"].map(
              (f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--success)]">✓</span>
                  {f}
                </li>
              ),
            )}
          </ul>
          {isPro ? (
            <button
              onClick={downgrade}
              className="mt-6 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--background)]"
            >
              Switch to Free
            </button>
          ) : (
            <Link
              href="/app"
              onClick={() => track("start_free", { source: "pricing" })}
              className="mt-6 rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-center text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Your current plan
            </Link>
          )}
        </Card>

        {/* Pro */}
        <Card className="glow-brand relative flex flex-col border-[var(--brand)] p-6">
          <span className="absolute -top-3 left-6 rounded-full bg-[var(--brand)] px-3 py-1 text-[11px] font-bold tracking-wide text-white">
            MOST POPULAR
          </span>
          <p className="font-display text-xl font-semibold text-[var(--brand)]">
            Ledger Pro
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The full path to debt-free.
          </p>
          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold tracking-tight">
              ${price}
            </span>
            <span className="text-sm text-[var(--muted)]">/mo</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {cycle === "yearly"
              ? `billed $${PRICING.yearlyPrice}/year`
              : "billed monthly"}
          </p>
          <ul className="mt-5 flex-1 space-y-2 text-sm">
            {["Everything in Free", "Unlimited debts", "Full amortization schedule", "Export plan to CSV", "Payment reminders (soon)", "Cloud sync (soon)", "Priority support"].map(
              (f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--success)]">✓</span>
                  {f}
                </li>
              ),
            )}
          </ul>
          {isPro ? (
            <div className="mt-6 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand-soft)]/60 px-4 py-2.5 text-center text-sm font-semibold text-[var(--brand)]">
              ✓ You&apos;re on Pro{billing ? ` · ${billing}` : ""}
            </div>
          ) : (
            <button
              onClick={startCheckout}
              className="mt-6 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
            >
              Upgrade to Pro
            </button>
          )}
        </Card>
      </div>

      {/* full comparison */}
      <div className="mx-auto mt-14 max-w-3xl">
        <h2 className="kicker mb-4 text-center">Compare every feature</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-4 py-3 text-xs font-medium text-[var(--muted)]">
                  Feature
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--muted)]">
                  Free
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--brand)]">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((f) => (
                <tr
                  key={f.label}
                  className="border-b border-[var(--border)]/60 last:border-0"
                >
                  <td className="px-4 py-2.5">{f.label}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Cell v={f.free} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Cell v={f.pro} pro />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="mx-auto mt-8 max-w-xl text-center text-xs text-[var(--muted)]">
        Prices in USD. This is a demo checkout — no real payment is taken. Cancel
        anytime; downgrading keeps your data on the free plan.
      </p>
    </main>
  );
}

function Cell({ v, pro = false }: { v: boolean | string; pro?: boolean }) {
  if (v === true)
    return (
      <span className={pro ? "text-[var(--brand)]" : "text-[var(--success)]"}>
        ✓
      </span>
    );
  if (v === false) return <span className="text-[var(--muted)]">—</span>;
  return <span className="text-xs text-[var(--muted)]">{v}</span>;
}
