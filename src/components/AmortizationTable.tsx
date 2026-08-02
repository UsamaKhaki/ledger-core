"use client";

import Link from "next/link";
import type { PlanResult, Strategy, Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { useSubscription } from "@/lib/subscription";
import { track } from "@/lib/analytics";
import { planToCsv, downloadCsv } from "@/lib/export";
import { Card } from "./ui";

export function AmortizationTable({
  plan,
  debts,
  strategy,
  onLocked,
}: {
  plan: PlanResult;
  debts: Debt[];
  strategy: Strategy;
  onLocked: (reason: string) => void;
}) {
  const { format } = useMoney();
  const { isPro } = useSubscription();

  if (!plan.feasible || plan.schedule.length === 0) return null;

  function exportCsv() {
    if (!isPro) {
      track("hit_paywall", { feature: "csv_export" });
      return onLocked("Exporting your plan to CSV is a Pro feature.");
    }
    track("export_csv");
    downloadCsv("debt-payoff-plan.csv", planToCsv(plan, debts, strategy));
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4 sm:p-5">
        <div>
          <h3 className="kicker flex items-center gap-2">
            Amortization schedule
            <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[var(--accent)]">
              PRO
            </span>
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Every payment, month by month, until you hit zero.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          ↓ Export CSV
        </button>
      </div>

      {isPro ? (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--surface-solid)] text-left">
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-4 py-2 text-xs font-medium">Month</th>
                <th className="px-4 py-2 text-xs font-medium">Payment</th>
                <th className="px-4 py-2 text-xs font-medium">Interest</th>
                <th className="px-4 py-2 text-right text-xs font-medium">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.schedule.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-[var(--border)]/60 last:border-0"
                >
                  <td className="px-4 py-2 text-xs whitespace-nowrap text-[var(--muted)]">
                    {row.label}
                  </td>
                  <td className="font-mono-num px-4 py-2 text-xs">
                    {format(row.totalPaid)}
                  </td>
                  <td className="font-mono-num px-4 py-2 text-xs text-[var(--accent)]">
                    {format(row.totalInterest)}
                  </td>
                  <td className="font-mono-num px-4 py-2 text-right text-xs font-semibold">
                    {format(row.totalBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          {/* blurred teaser of the first rows */}
          <div
            className="pointer-events-none select-none px-4 py-3 opacity-40 blur-[3px]"
            aria-hidden
          >
            {plan.schedule.slice(0, 5).map((row) => (
              <div
                key={row.month}
                className="flex justify-between border-b border-[var(--border)]/60 py-2 text-xs"
              >
                <span>{row.label}</span>
                <span className="font-mono-num">{format(row.totalPaid)}</span>
                <span className="font-mono-num">{format(row.totalBalance)}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-[var(--surface-solid)] via-[var(--surface-solid)]/80 to-transparent p-4 text-center">
            <p className="text-sm font-semibold">
              See your full payoff schedule
            </p>
            <p className="max-w-xs text-xs text-[var(--muted)]">
              Unlock the complete month-by-month breakdown and CSV export with
              Ledger Pro.
            </p>
            <Link
              href="/pricing"
              onClick={() => {
                track("hit_paywall", { feature: "amortization" });
                track("click_upgrade", { source: "amortization" });
              }}
              className="mt-1 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
