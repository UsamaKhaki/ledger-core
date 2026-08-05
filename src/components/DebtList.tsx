"use client";

import Link from "next/link";
import type { Debt, PlanResult } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { useNow } from "@/lib/useNow";
import { kindMeta, utilization, utilizationTone, dueInfo } from "@/lib/cards";
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
  const now = useNow();

  if (debts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-[var(--muted)]">
          Nothing tracked yet. Add your first card or debt to see your plan.
        </p>
      </Card>
    );
  }

  const payoffById = new Map(plan.perDebt.map((p) => [p.debtId, p]));

  return (
    <div className="space-y-2">
      {debts.map((d) => {
        const meta = kindMeta(d.kind);
        const cleared = d.balance <= 0.005;
        const util = utilization(d);
        const due =
          d.dueDay != null && now != null ? dueInfo(d.dueDay, now) : null;
        const payoff = payoffById.get(d.id);

        return (
          <Card key={d.id} className="card-hover p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${
                  cleared
                    ? "border-[var(--success)]/40 bg-[var(--success)]/10"
                    : "border-[var(--border)] bg-[var(--elevate)]"
                }`}
                aria-hidden
              >
                {cleared ? "✓" : meta.icon}
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  <Link href={`/app/debt/${d.id}`} className="truncate hover:underline">
                    {d.name}
                  </Link>
                  {cleared ? (
                    <span className="rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]">
                      Paid off
                    </span>
                  ) : due && due.daysUntil <= 7 ? (
                    <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                      {due.label}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {d.issuer ? `${d.issuer} · ` : ""}
                  {meta.label} ·{" "}
                  <span className="font-mono-num">{format(d.balance)}</span> left
                  · {d.apr}% APR
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
                  className="rounded-xl px-2 py-1 text-xs text-[var(--muted)] transition hover:bg-[var(--elevate)] hover:text-[var(--foreground)]"
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

            {/* utilization for cards, else payoff progress */}
            {util != null && !cleared ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, util)}%`,
                      background: utilizationTone(util),
                    }}
                  />
                </div>
                <span className="font-mono-num w-32 shrink-0 text-right text-[11px] text-[var(--muted)]">
                  {util}% used
                  {d.creditLimit ? ` of ${format(d.creditLimit)}` : ""}
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-[var(--success)] transition-all"
                    style={{
                      width: `${
                        cleared
                          ? 100
                          : Math.min(
                              100,
                              Math.round(
                                (Math.max(
                                  0,
                                  Math.max(d.startingBalance, d.balance) -
                                    d.balance,
                                ) /
                                  Math.max(d.startingBalance, d.balance, 1)) *
                                  100,
                              ),
                            )
                      }%`,
                    }}
                  />
                </div>
                <span className="font-mono-num w-24 shrink-0 text-right text-[11px] text-[var(--muted)]">
                  min {format(d.minPayment)}/mo
                </span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
