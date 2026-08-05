"use client";

import { useState } from "react";
import type { Debt, DebtInput, PlanResult, Payment } from "@/lib/types";
import { totalBalance, formatDuration } from "@/lib/debt";
import { isCardKind, dueInfo } from "@/lib/cards";
import { useMoney } from "@/lib/CurrencyContext";
import { Card, StatStrip } from "./ui";
import { CreditCardTile } from "./CreditCardTile";
import { LoanRow } from "./LoanRow";
import { UpcomingPayments } from "./UpcomingPayments";
import { DebtForm } from "./DebtForm";

export function Dashboard({
  debts,
  payments,
  plan,
  now,
  onLogPayment,
  onAdd,
  onOpenImport,
  atLimit,
  onLimit,
  isPro,
  freeLimit,
}: {
  debts: Debt[];
  payments: Payment[];
  plan: PlanResult;
  now: number | null;
  onLogPayment: (debt: Debt) => void;
  onAdd: (input: DebtInput) => void;
  onOpenImport: () => void;
  atLimit: boolean;
  onLimit: () => void;
  isPro: boolean;
  freeLimit: number;
}) {
  const { format } = useMoney();
  const [showAdd, setShowAdd] = useState(false);

  const cards = debts.filter((d) => isCardKind(d.kind));
  const loans = debts.filter((d) => !isCardKind(d.kind));

  // Average utilization across cards that have a credit limit.
  const limited = cards.filter((c) => c.creditLimit && c.creditLimit > 0);
  const cardBalance = limited.reduce((s, c) => s + c.balance, 0);
  const cardLimit = limited.reduce((s, c) => s + (c.creditLimit ?? 0), 0);
  const avgUtil = cardLimit > 0 ? Math.round((cardBalance / cardLimit) * 100) : null;

  // Soonest upcoming due across everything not yet cleared.
  const nextDue = debts
    .filter((d) => d.dueDay != null && d.balance > 0.005 && now != null)
    .map((d) => ({ d, info: dueInfo(d.dueDay as number, now as number) }))
    .sort((a, b) => a.info.daysUntil - b.info.daysUntil)[0];

  const recent = payments.slice(0, 5);
  const debtNameById = new Map(debts.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-8">
      {/* summary */}
      <div className="rounded-2xl border-y border-[var(--border)] py-5">
        <StatStrip
          stats={[
            {
              label: "Total owed",
              value: format(totalBalance(debts)),
              sub: `${debts.length} account${debts.length === 1 ? "" : "s"}`,
              accent: "danger",
            },
            {
              label: "Debt-free by",
              value: plan.feasible ? plan.debtFreeLabel : "—",
              sub: plan.feasible ? formatDuration(plan.months) : "raise budget",
              accent: "success",
            },
            {
              label: "Card utilization",
              value: avgUtil != null ? `${avgUtil}%` : "—",
              sub: limited.length
                ? `across ${limited.length} card${limited.length === 1 ? "" : "s"}`
                : "no card limits",
              accent: "accent",
            },
            {
              label: "Next due",
              value: nextDue ? nextDue.info.label.replace("Due ", "") : "—",
              sub: nextDue ? nextDue.d.name : "nothing scheduled",
              accent: "brand",
            },
          ]}
        />
      </div>

      {/* add affordance */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Your accounts
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImport}
            className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm font-semibold transition hover:border-[var(--border-strong)]"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm font-semibold transition hover:border-[var(--border-strong)]"
          >
            {showAdd ? "Close" : "+ Add account"}
          </button>
        </div>
      </div>
      {showAdd ? (
        <Card className="p-4 sm:p-5">
          <DebtForm
            onAdd={(input) => {
              onAdd(input);
              setShowAdd(false);
            }}
            atLimit={atLimit}
            onLimit={onLimit}
          />
          {!isPro ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Free plan tracks up to {freeLimit} accounts.
            </p>
          ) : null}
        </Card>
      ) : null}

      {now != null ? (
        <UpcomingPayments debts={debts} now={now} onLogPayment={onLogPayment} />
      ) : null}

      {/* credit cards */}
      {cards.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="kicker">Credit cards</h3>
            <span className="text-xs text-[var(--muted)]">({cards.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((d) => (
              <CreditCardTile key={d.id} debt={d} now={now} />
            ))}
          </div>
        </section>
      ) : null}

      {/* loans & other */}
      {loans.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="kicker">Loans &amp; other</h3>
            <span className="text-xs text-[var(--muted)]">({loans.length})</span>
          </div>
          <div className="space-y-2">
            {loans.map((d) => (
              <LoanRow key={d.id} debt={d} now={now} onLogPayment={onLogPayment} />
            ))}
          </div>
        </section>
      ) : null}

      {/* recent payments */}
      {recent.length > 0 ? (
        <section>
          <h3 className="kicker mb-2">Recent payments</h3>
          <Card className="p-4">
            <ul className="divide-y divide-[var(--border)]">
              {recent.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 truncate text-[var(--muted)]">
                    {debtNameById.get(p.debtId) ?? "Account"}
                    {p.clearedDebt ? " · cleared 🎉" : ""}
                  </span>
                  <span className="font-mono-num ml-2 shrink-0 font-semibold text-[var(--success)]">
                    {format(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
