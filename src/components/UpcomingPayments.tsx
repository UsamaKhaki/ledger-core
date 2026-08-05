"use client";

import Link from "next/link";
import type { Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { kindMeta } from "@/lib/cards";
import { upcoming } from "@/lib/reminders";
import { Card } from "./ui";

function urgencyTone(days: number) {
  if (days <= 2) return "var(--danger)";
  if (days <= 7) return "var(--accent)";
  return "var(--muted)";
}

export function UpcomingPayments({
  debts,
  now,
  onLogPayment,
}: {
  debts: Debt[];
  now: number | null;
  onLogPayment: (debt: Debt) => void;
}) {
  const { format } = useMoney();

  // `now` resolves after mount; render nothing meaningful until then.
  const items = now ? upcoming(debts, now) : [];
  if (items.length === 0) return null;

  const shown = items.slice(0, 4);

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="kicker">Upcoming payments</h3>
        {items.length > shown.length ? (
          <span className="text-xs text-[var(--muted)]">
            +{items.length - shown.length} more
          </span>
        ) : null}
      </div>

      <ul className="space-y-1.5">
        {shown.map(({ debt, daysUntil, label, ordinal }) => (
          <li
            key={debt.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--elevate)]"
          >
            <span className="text-base" aria-hidden>
              {kindMeta(debt.kind).icon}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/app/debt/${debt.id}`}
                className="block truncate text-sm font-medium hover:underline"
              >
                {debt.name}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                Due {ordinal} ·{" "}
                <span
                  className="font-medium"
                  style={{ color: urgencyTone(daysUntil) }}
                >
                  {label}
                </span>
              </p>
            </div>
            <span className="font-mono-num shrink-0 text-sm">
              {format(debt.minPayment)}
            </span>
            <button
              onClick={() => onLogPayment(debt)}
              className="shrink-0 rounded-lg bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
            >
              Pay
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
