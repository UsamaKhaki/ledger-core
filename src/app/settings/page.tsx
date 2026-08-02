"use client";

import Link from "next/link";
import { CURRENCIES, useMoney } from "@/lib/CurrencyContext";
import { useSubscription } from "@/lib/subscription";
import { Card } from "@/components/ui";

export default function SettingsPage() {
  const { settings, setCurrency, format } = useMoney();
  const { isPro, billing, downgrade } = useSubscription();

  function clearAllData() {
    if (
      !confirm(
        "This permanently deletes all your debts, payments, and settings from this browser. Continue?",
      )
    )
      return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("debtplanner."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    // Reload so every provider re-reads a clean slate.
    location.href = "/app";
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="reveal mb-9 border-b border-[var(--border)] pb-6">
        <p className="kicker">Preferences</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Everything is saved in your browser, alongside your debt data.
        </p>
      </header>

      <div className="space-y-6">
        {/* Currency */}
        <Card className="p-4 sm:p-5">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="kicker">Currency</h2>
            <span className="text-xs text-[var(--muted)]">
              Preview:{" "}
              <span className="font-mono-num text-[var(--foreground)]">
                {format(1234)}
              </span>
            </span>
          </div>
          <p className="mb-3 text-xs text-[var(--muted)]">
            Choose how amounts are displayed across the app.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CURRENCIES.map((c) => {
              const active = settings.currency === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand)]/5"
                      : "border-[var(--border)] hover:border-[var(--brand)]"
                  }`}
                >
                  <span className="w-6 text-center text-base font-semibold">
                    {c.symbol}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{c.code}</span>
                    <span className="block truncate text-[11px] text-[var(--muted)]">
                      {c.name}
                    </span>
                  </span>
                  {active ? (
                    <span className="ml-auto text-[var(--brand)]">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Plan & billing */}
        <Card className="p-4 sm:p-5">
          <h2 className="kicker mb-3">Plan & billing</h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">
                {isPro ? "Ledger Pro" : "Free plan"}
                {isPro && billing ? (
                  <span className="ml-2 text-sm font-normal text-[var(--muted)]">
                    · {billing}
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {isPro
                  ? "Unlimited debts, full schedule, and CSV export are unlocked."
                  : "Up to 3 debts. Upgrade for unlimited debts and more."}
              </p>
            </div>
            {isPro ? (
              <button
                onClick={() => {
                  // Production: open Stripe Billing Portal (customer.portal URL).
                  if (confirm("Cancel Pro and return to the free plan?"))
                    downgrade();
                }}
                className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--background)]"
              >
                Manage
              </button>
            ) : (
              <Link
                href="/pricing"
                className="shrink-0 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Upgrade
              </Link>
            )}
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-4 sm:p-5">
          <h2 className="kicker">Your data & privacy</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Everything you enter stays on this device, in your browser&apos;s
            local storage. Nothing is uploaded to any server. Clearing your
            browser data, or using a different device or browser, will start you
            fresh.
          </p>
        </Card>

        {/* Danger zone */}
        <Card className="border-[var(--danger)]/40 p-4 sm:p-5">
          <h2 className="kicker !text-[var(--danger)]">Danger zone</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Permanently delete all debts, logged payments, and settings from
            this browser. This can&apos;t be undone.
          </p>
          <button
            onClick={clearAllData}
            className="mt-3 rounded-xl border border-[var(--danger)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white"
          >
            Delete all my data
          </button>
        </Card>

        <Link
          href="/app"
          className="inline-block text-sm font-medium text-[var(--brand)] hover:underline"
        >
          ← Back to planner
        </Link>
      </div>
    </main>
  );
}
