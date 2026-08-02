"use client";

import type { Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { ProgressRing } from "./graphics";
import { Card } from "./ui";

export function Progress({ debts }: { debts: Debt[] }) {
  const { format } = useMoney();

  const originalTotal = debts.reduce(
    (s, d) => s + Math.max(d.startingBalance, d.balance),
    0,
  );
  const currentTotal = debts.reduce((s, d) => s + Math.max(0, d.balance), 0);
  const paidOff = Math.max(0, originalTotal - currentTotal);
  const pct =
    originalTotal > 0
      ? Math.min(100, Math.round((paidOff / originalTotal) * 100))
      : 0;
  const clearedCount = debts.filter((d) => d.balance <= 0.005).length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="kicker">Your progress</h3>
        <span className="text-xs text-[var(--muted)]">
          {clearedCount} of {debts.length} debts cleared
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        {/* animated ring — remounts (re-animates) when the percent changes */}
        <div className="w-40 shrink-0 sm:w-44">
          <ProgressRing key={pct} percent={pct} label="paid off" />
        </div>

        {/* figures */}
        <div className="w-full space-y-3">
          <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
            <span className="text-sm text-[var(--muted)]">Paid off so far</span>
            <span className="font-display text-xl font-bold text-[var(--success)]">
              {format(paidOff)}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
            <span className="text-sm text-[var(--muted)]">Still to go</span>
            <span className="font-mono-num text-lg font-semibold">
              {format(currentTotal)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[var(--muted)]">Original total</span>
            <span className="font-mono-num text-sm text-[var(--muted)]">
              {format(originalTotal)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
