"use client";

import type { Debt, PlanResult } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { Card } from "./ui";

export function DebtList({
  debts,
  plan,
  onRemove,
  onLogPayment,
  onEdit,
}: {
  debts: Debt[];
  plan: PlanResult;
  onRemove: (id: string) => void;
  onLogPayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
}) {
  const { format } = useMoney();

  if (debts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-[var(--muted)]">
          No debts yet. Add your first one to see your payoff plan.
        </p>
      </Card>
    );
  }

  const payoffById = new Map(plan.perDebt.map((p) => [p.debtId, p]));

  return (
    <div className="space-y-2">
      {debts.map((d, i) => {
        const payoff = payoffById.get(d.id);
        const cleared = d.balance <= 0.005;
        const start = Math.max(d.startingBalance, d.balance, 1);
        const paid = Math.max(0, start - d.balance);
        const pct = Math.min(100, Math.round((paid / start) * 100));

        return (
          <Card key={d.id} className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div
                className={`font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  cleared
                    ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                    : "border-[var(--border)] text-[var(--brand)]"
                }`}
              >
                {cleared ? "✓" : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {d.name}
                  {cleared ? (
                    <span className="ml-2 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--success)]">
                      Paid off
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  <span className="font-mono-num">{format(d.balance)}</span> left
                  · {d.apr}% APR · min{" "}
                  <span className="font-mono-num">{format(d.minPayment)}</span>/mo
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!cleared ? (
                  <button
                    onClick={() => onLogPayment(d)}
                    className="rounded-xl bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
                  >
                    Log payment
                  </button>
                ) : payoff ? (
                  <span className="hidden text-xs text-[var(--muted)] sm:inline">
                    {format(payoff.interestPaid)} interest
                  </span>
                ) : null}
                <button
                  onClick={() => onEdit(d)}
                  aria-label={`Edit ${d.name}`}
                  className="rounded-xl px-2 py-1 text-xs text-[var(--muted)] transition hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemove(d.id)}
                  aria-label={`Remove ${d.name}`}
                  className="rounded-xl px-2 py-1 text-xs text-[var(--muted)] transition hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-[var(--success)] transition-all"
                  style={{ width: `${cleared ? 100 : pct}%` }}
                />
              </div>
              <span className="font-mono-num w-28 shrink-0 text-right text-[11px] text-[var(--muted)]">
                {format(paid)} · {cleared ? 100 : pct}%
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
