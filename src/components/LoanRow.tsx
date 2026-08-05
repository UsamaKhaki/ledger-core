"use client";

import Link from "next/link";
import type { Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { kindMeta, dueInfo } from "@/lib/cards";
import { Card } from "./ui";

export function LoanRow({
  debt,
  now,
  onLogPayment,
}: {
  debt: Debt;
  now: number | null;
  onLogPayment: (debt: Debt) => void;
}) {
  const { format } = useMoney();
  const meta = kindMeta(debt.kind);
  const cleared = debt.balance <= 0.005;
  const due = debt.dueDay != null && now != null ? dueInfo(debt.dueDay, now) : null;

  const start = Math.max(debt.startingBalance, debt.balance, 1);
  const paid = Math.max(0, start - debt.balance);
  const pct = cleared ? 100 : Math.min(100, Math.round((paid / start) * 100));

  return (
    <Card className="card-hover p-4">
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
          <Link
            href={`/app/debt/${debt.id}`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {debt.name}
          </Link>
          <p className="truncate text-xs text-[var(--muted)]">
            {debt.issuer ? `${debt.issuer} · ` : ""}
            {meta.label} · {debt.apr}% APR
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono-num text-sm font-semibold">
            {format(debt.balance)}
          </p>
          <p className="text-[11px] text-[var(--muted)]">left</p>
        </div>
      </div>

      {/* payoff progress */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--success)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono-num w-28 shrink-0 text-right text-[11px] text-[var(--muted)]">
          {pct}% paid off
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          Min {format(debt.minPayment)}/mo
          {due ? (
            <>
              {" · "}
              <span className={due.daysUntil <= 7 ? "text-[var(--accent)]" : ""}>
                {due.label}
              </span>
            </>
          ) : null}
        </span>
        {!cleared ? (
          <button
            onClick={() => onLogPayment(debt)}
            className="rounded-xl bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
          >
            Log payment
          </button>
        ) : (
          <span className="text-xs font-semibold text-[var(--success)]">
            Paid off ✓
          </span>
        )}
      </div>
    </Card>
  );
}
