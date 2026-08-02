"use client";

import { useMemo, useState } from "react";
import type { Debt, Payment, Strategy } from "@/lib/types";
import {
  buildPlan,
  totalMinimums,
  totalBalance,
  formatDuration,
} from "@/lib/debt";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useMoney } from "@/lib/CurrencyContext";
import { useSubscription } from "@/lib/subscription";
import { track } from "@/lib/analytics";
import { DebtForm } from "@/components/DebtForm";
import { DebtList } from "@/components/DebtList";
import { PayoffChart } from "@/components/PayoffChart";
import { Comparison } from "@/components/Comparison";
import { Progress } from "@/components/Progress";
import { AmortizationTable } from "@/components/AmortizationTable";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { EditDebtModal } from "@/components/EditDebtModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Celebration,
  makeConfetti,
  type CelebrationState,
} from "@/components/Celebration";
import { Card, StatStrip } from "@/components/ui";

const SAMPLE: Debt[] = [
  { id: "s1", name: "Store card", balance: 1200, startingBalance: 1200, apr: 8.0, minPayment: 40 },
  { id: "s2", name: "Credit card", balance: 6000, startingBalance: 6000, apr: 24.99, minPayment: 150 },
  { id: "s3", name: "Personal loan", balance: 4000, startingBalance: 4000, apr: 12.0, minPayment: 120 },
];

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(performance.now())}`;
}

export default function PlannerPage() {
  const { format } = useMoney();
  const { isPro, limits } = useSubscription();

  const { value: rawDebts, setValue: setDebts, hydrated } = useLocalStorage<
    Debt[]
  >("debtplanner.debts", []);
  const { value: strategy, setValue: setStrategy } =
    useLocalStorage<Strategy>("debtplanner.strategy", "avalanche");
  const { value: extra, setValue: setExtra } = useLocalStorage<number>(
    "debtplanner.extra",
    0,
  );
  const { value: payments, setValue: setPayments } = useLocalStorage<Payment[]>(
    "debtplanner.payments",
    [],
  );

  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);

  // Ensure every debt has a startingBalance (migrates older saved data).
  const debts = useMemo(
    () =>
      rawDebts.map((d) => ({
        ...d,
        startingBalance: d.startingBalance ?? d.balance,
      })),
    [rawDebts],
  );

  const minSum = totalMinimums(debts);
  const budget = minSum + Math.max(0, extra);

  const plan = useMemo(
    () => buildPlan(debts, budget, strategy),
    [debts, budget, strategy],
  );
  const avalanche = useMemo(
    () => buildPlan(debts, budget, "avalanche"),
    [debts, budget],
  );
  const snowball = useMemo(
    () => buildPlan(debts, budget, "snowball"),
    [debts, budget],
  );
  const baseline = useMemo(
    () => buildPlan(debts, minSum, strategy),
    [debts, minSum, strategy],
  );

  const interestSaved = Math.max(0, baseline.totalInterest - plan.totalInterest);
  const monthsSaved = Math.max(0, baseline.months - plan.months);

  const atLimit = !isPro && debts.length >= limits.maxDebts;

  function addDebt(d: Debt) {
    if (!isPro && debts.length >= limits.maxDebts) {
      track("hit_paywall", { feature: "max_debts" });
      setUpgradeReason(
        `The free plan tracks up to ${limits.maxDebts} debts. Upgrade to add this one and as many as you like.`,
      );
      return;
    }
    setDebts([...debts, d]);
    track("add_debt", { count: debts.length + 1 });
  }
  function hitDebtLimit() {
    track("hit_paywall", { feature: "max_debts" });
    setUpgradeReason(
      `You've reached the free plan's ${limits.maxDebts}-debt limit. Upgrade to Pro for unlimited debts.`,
    );
  }
  function removeDebt(id: string) {
    setDebts(debts.filter((d) => d.id !== id));
  }
  function saveDebt(updated: Debt) {
    setDebts(debts.map((d) => (d.id === updated.id ? updated : d)));
    setEditingDebt(null);
  }

  function logPayment(debtId: string, amount: number) {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const newBalance = Math.max(0, debt.balance - amount);
    const cleared = debt.balance > 0.005 && newBalance <= 0.005;

    const updated = debts.map((d) =>
      d.id === debtId ? { ...d, balance: newBalance } : d,
    );
    setDebts(updated);
    setPayments([
      {
        id: newId(),
        debtId,
        amount,
        dateISO: new Date().toISOString(),
        clearedDebt: cleared,
      },
      ...payments,
    ]);
    setPayingDebt(null);

    if (cleared) {
      const allCleared = updated.every((d) => d.balance <= 0.005);
      setCelebration(
        allCleared
          ? {
              title: "You're debt-free! 🎉",
              subtitle: "Every last debt is paid off. Incredible work.",
              big: true,
              pieces: makeConfetti(true),
            }
          : {
              title: `${debt.name} is paid off!`,
              subtitle:
                "One down — that freed-up payment now attacks the next debt.",
              big: false,
              pieces: makeConfetti(false),
            },
      );
    }
  }

  const hasDebts = debts.length > 0;
  const recent = payments.slice(0, 5);
  const debtNameById = new Map(debts.map((d) => [d.id, d.name]));

  return (
    <main className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:w-4/5">
      {/* decorative background orbs (glow through the glass cards) */}
      <div
        className="blob fixed left-[-6%] top-24 h-72 w-72 bg-[#3b5bd0]"
        style={{ opacity: 0.22 }}
        aria-hidden
      />
      <div
        className="blob fixed right-[-4%] top-[45%] h-80 w-80 bg-[#2f7d6b]"
        style={{ opacity: 0.18, animationDelay: "-8s" }}
        aria-hidden
      />

      <Celebration state={celebration} onDone={() => setCelebration(null)} />
      <UpgradeModal reason={upgradeReason} onClose={() => setUpgradeReason(null)} />
      {payingDebt ? (
        <LogPaymentModal
          key={payingDebt.id}
          debt={payingDebt}
          onClose={() => setPayingDebt(null)}
          onConfirm={logPayment}
        />
      ) : null}
      {editingDebt ? (
        <EditDebtModal
          key={editingDebt.id}
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onSave={saveDebt}
        />
      ) : null}

      <header className="reveal mb-9 border-b border-[var(--border)] pb-6">
        <p className="kicker">A calm plan to reach zero</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Your payoff plan
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          List your debts, pick a strategy, log payments as you go, and watch
          your debt-free date get closer.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Left column: input */}
        <div className="reveal space-y-4" style={{ animationDelay: "0.08s" }}>
          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="kicker">Add a debt</h2>
              {!isPro && hasDebts ? (
                <span className="text-[11px] text-[var(--muted)]">
                  {debts.length}/{limits.maxDebts} free
                </span>
              ) : null}
            </div>
            <DebtForm onAdd={addDebt} atLimit={atLimit} onLimit={hitDebtLimit} />
            {!hasDebts && hydrated ? (
              <button
                onClick={() => setDebts(SAMPLE)}
                className="mt-3 w-full rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                Try it with sample debts
              </button>
            ) : null}
            {atLimit ? (
              <p className="mt-3 rounded-xl border-l-2 border-[var(--accent)] bg-[var(--accent)]/8 px-3 py-2 text-xs text-[var(--muted)]">
                You&apos;re on the free plan ({limits.maxDebts} debts). Go Pro for
                unlimited debts, the full schedule, and CSV export.
              </p>
            ) : null}
          </Card>

          {hasDebts ? (
            <div className="border-t border-[var(--border)] pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="kicker">Extra payment / mo</h2>
                <span className="font-mono-num text-sm font-semibold text-[var(--brand)]">
                  +{format(extra)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={10}
                value={Math.min(extra, 1000)}
                onChange={(e) => setExtra(Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
                aria-label="Extra monthly payment"
              />
              <p className="mt-2 text-xs text-[var(--muted)]">
                You pay {format(minSum)} in minimums
                {extra > 0 ? (
                  <>
                    {" "}
                    + {format(extra)} extra ={" "}
                    <span className="font-semibold text-[var(--foreground)]">
                      {format(budget)}/mo
                    </span>
                  </>
                ) : (
                  " total."
                )}
              </p>
              {extra > 0 && interestSaved > 1 ? (
                <p className="mt-2 rounded-xl bg-[var(--accent)]/10 px-3 py-2 text-xs">
                  That extra saves{" "}
                  <span className="font-semibold text-[var(--accent)]">
                    {format(interestSaved)}
                  </span>
                  {monthsSaved > 0 ? (
                    <>
                      {" "}
                      and gets you debt-free{" "}
                      <span className="font-semibold">
                        {formatDuration(monthsSaved)}
                      </span>{" "}
                      sooner.
                    </>
                  ) : (
                    " in interest."
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          {hasDebts ? (
            <div className="border-t border-[var(--border)] pt-5">
              <h2 className="kicker mb-3">Strategy</h2>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "avalanche", label: "❄️ Avalanche" },
                    { key: "snowball", label: "⛄ Snowball" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStrategy(s.key)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      strategy === s.key
                        ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {recent.length > 0 ? (
            <div className="border-t border-[var(--border)] pt-5">
              <h2 className="kicker mb-2">Recent payments</h2>
              <ul className="divide-y divide-[var(--border)]">
                {recent.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2.5 text-xs first:pt-1 last:pb-0"
                  >
                    <span className="min-w-0 truncate text-[var(--muted)]">
                      {debtNameById.get(p.debtId) ?? "Debt"}
                      {p.clearedDebt ? " · cleared 🎉" : ""}
                    </span>
                    <span className="font-mono-num ml-2 shrink-0 font-semibold text-[var(--success)]">
                      {format(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Right column: results */}
        <div className="reveal space-y-4" style={{ animationDelay: "0.16s" }}>
          {hasDebts ? (
            <>
              <Progress debts={debts} />

              {!plan.feasible ? (
                <Card className="border-[var(--danger)] p-4">
                  <p className="text-sm font-medium text-[var(--danger)]">
                    {plan.reason}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Minimum needed:{" "}
                    <span className="font-mono-num font-semibold text-[var(--foreground)]">
                      {format(plan.minRequired)}/mo
                    </span>
                  </p>
                </Card>
              ) : null}

              <div className="border-y border-[var(--border)] py-5">
                <StatStrip
                  stats={[
                    {
                      label: "Debt left",
                      value: format(totalBalance(debts)),
                      sub: `${debts.length} debt${debts.length > 1 ? "s" : ""}`,
                      accent: "danger",
                    },
                    {
                      label: "Debt-free by",
                      value: plan.feasible ? plan.debtFreeLabel : "—",
                      sub: plan.feasible ? formatDuration(plan.months) : "—",
                      accent: "success",
                    },
                    {
                      label: "Interest ahead",
                      value: plan.feasible ? format(plan.totalInterest) : "—",
                      sub: "from here on",
                      accent: "accent",
                    },
                    {
                      label: "Monthly payment",
                      value: format(budget),
                      sub: extra > 0 ? `incl. +${format(extra)}` : "minimums",
                      accent: "brand",
                    },
                  ]}
                />
              </div>

              {plan.feasible && plan.schedule.length > 0 ? (
                <PayoffChart plan={plan} />
              ) : null}

              <Comparison
                avalanche={avalanche}
                snowball={snowball}
                active={strategy}
              />

              <AmortizationTable
                plan={plan}
                debts={debts}
                strategy={strategy}
                onLocked={setUpgradeReason}
              />

              <DebtList
                debts={debts}
                plan={plan}
                onRemove={removeDebt}
                onLogPayment={setPayingDebt}
                onEdit={setEditingDebt}
              />

              <button
                onClick={() => {
                  if (confirm("Clear all debts and payments and start over?")) {
                    setDebts([]);
                    setPayments([]);
                  }
                }}
                className="text-xs text-[var(--muted)] underline-offset-2 hover:underline"
              >
                Clear everything
              </button>
            </>
          ) : (
            <Card className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <span className="font-display text-5xl text-[var(--brand)]">0</span>
              <p className="font-display mt-4 text-xl font-semibold">
                Add your debts to build your plan
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
                Enter each debt&apos;s balance, interest rate, and minimum
                payment. We&apos;ll show you the fastest, cheapest way out —
                right down to the month you&apos;re free.
              </p>
            </Card>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-[var(--muted)]">
        Estimates only. Interest is compounded monthly and assumes fixed
        balances and rates. Not financial advice.
      </footer>
    </main>
  );
}
