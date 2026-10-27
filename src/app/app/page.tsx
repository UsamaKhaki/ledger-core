"use client";

import { useEffect, useMemo, useState } from "react";
import type { Debt, DebtInput, Strategy } from "@/lib/types";
import {
  buildPlan,
  totalMinimums,
  totalBalance,
  formatDuration,
} from "@/lib/debt";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useDebtsData } from "@/lib/useDebtsData";
import { useNow } from "@/lib/useNow";
import {
  DEFAULT_REMINDERS,
  notifyDueSoon,
  type ReminderPrefs,
} from "@/lib/reminders";
import { useMoney } from "@/lib/CurrencyContext";
import { useSubscription } from "@/lib/subscription";
import { useAuth } from "@/lib/auth/useAuth";
import { track } from "@/lib/analytics";
import { DebtForm } from "@/components/DebtForm";
import { Dashboard } from "@/components/Dashboard";
import { DashboardSkeleton } from "@/components/Skeleton";
import { PayoffChart } from "@/components/PayoffChart";
import { Comparison } from "@/components/Comparison";
import { Progress } from "@/components/Progress";
import { AmortizationTable } from "@/components/AmortizationTable";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { EditDebtModal } from "@/components/EditDebtModal";
import { ImportModal } from "@/components/ImportModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Celebration,
  makeConfetti,
  type CelebrationState,
} from "@/components/Celebration";
import { Card, StatStrip } from "@/components/ui";

type Tab = "overview" | "plan";

export default function PlannerPage() {
  const { format } = useMoney();
  const { isPro, limits } = useSubscription();
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";

  const {
    debts,
    payments,
    loading,
    loadError,
    addDebt: apiAddDebt,
    saveDebt: apiSaveDebt,
    clearAll: apiClearAll,
    logPayment: apiLogPayment,
  } = useDebtsData();

  const { value: strategy, setValue: setStrategy } =
    useLocalStorage<Strategy>("debtplanner.strategy", "avalanche");
  const { value: extra, setValue: setExtra } = useLocalStorage<number>(
    "debtplanner.extra",
    0,
  );
  const { value: tab, setValue: setTab } = useLocalStorage<Tab>(
    "debtplanner.tab",
    "overview",
  );
  const { value: reminders } = useLocalStorage<ReminderPrefs>(
    "debtplanner.reminders",
    DEFAULT_REMINDERS,
  );

  const now = useNow();

  useEffect(() => {
    if (!reminders.enabled || now == null) return;
    notifyDueSoon(debts, now, reminders.leadDays);
  }, [reminders.enabled, reminders.leadDays, now, debts]);

  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [importing, setImporting] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationState>(null);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

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

  async function addDebt(input: DebtInput) {
    if (!isPro && debts.length >= limits.maxDebts) {
      track("hit_paywall", { feature: "max_debts" });
      setUpgradeReason(
        `The free plan tracks up to ${limits.maxDebts} cards & debts. Upgrade to add this one and as many as you like.`,
      );
      return;
    }
    const res = await apiAddDebt(input);
    if (res.error) {
      setDataError(
        "Couldn't save. If you just connected Supabase, run the database schema (docs/supabase-schema.sql) in the SQL editor, then try again.",
      );
      return;
    }
    setDataError(null);
    track("add_debt", { count: debts.length + 1, kind: input.kind });
  }
  async function importDebts(
    inputs: DebtInput[],
  ): Promise<{ added: number; skipped: number }> {
    let count = debts.length;
    let added = 0;
    let skipped = 0;
    for (const input of inputs) {
      if (!isPro && count >= limits.maxDebts) {
        skipped++;
        continue;
      }
      const res = await apiAddDebt(input);
      if (res.error) {
        skipped++;
        continue;
      }
      count++;
      added++;
    }
    if (added > 0) track("add_debt", { via: "import", count: added });
    return { added, skipped };
  }
  function hitDebtLimit() {
    track("hit_paywall", { feature: "max_debts" });
    setUpgradeReason(
      `You've reached the free plan's ${limits.maxDebts}-debt limit. Upgrade to Pro for unlimited debts.`,
    );
  }
  async function saveDebt(updated: Debt) {
    const res = await apiSaveDebt(updated.id, {
      name: updated.name,
      kind: updated.kind,
      issuer: updated.issuer,
      balance: updated.balance,
      apr: updated.apr,
      minPayment: updated.minPayment,
      creditLimit: updated.creditLimit,
      dueDay: updated.dueDay,
    });
    if (res.error) {
      setDataError(res.error);
      return;
    }
    setDataError(null);
    setEditingDebt(null);
  }

  async function clearAll() {
    const res = await apiClearAll();
    if (res.error) setDataError(res.error);
  }

  async function logPayment(debtId: string, amount: number) {
    setPayingDebt(null);
    const res = await apiLogPayment(debtId, amount);
    if (!res.ok) {
      setDataError(res.error);
      return;
    }
    setDataError(null);
    if (!res.cleared) return;

    const allCleared = debts.every((d) =>
      d.id === res.debt.id ? true : d.balance <= 0.005,
    );
    setCelebration(
      allCleared
        ? {
            title: "You're debt-free! 🎉",
            subtitle: "Every last debt is paid off. Incredible work.",
            big: true,
            pieces: makeConfetti(true),
          }
        : {
            title: `${res.debt.name} is paid off!`,
            subtitle:
              "One down — that freed-up payment now attacks the next debt.",
            big: false,
            pieces: makeConfetti(false),
          },
    );
  }

  const hasDebts = debts.length > 0;

  return (
    <main className="relative mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:w-4/5">
      {/* Clipped layer: the blobs sit partly off-screen and would otherwise
          widen the page into a horizontal scroll on phones. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="blob left-[-6%] top-24 h-72 w-72 bg-[#6366f1]"
          style={{ opacity: 0.22 }}
        />
        <div
          className="blob right-[-4%] top-[45%] h-80 w-80 bg-[#34d399]"
          style={{ opacity: 0.18, animationDelay: "-8s" }}
        />
      </div>

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
      {importing ? (
        <ImportModal
          onClose={() => setImporting(false)}
          onImport={importDebts}
          remainingSlots={isPro ? Infinity : Math.max(0, limits.maxDebts - debts.length)}
        />
      ) : null}

      {dataError || loadError ? (
        <div
          role="alert"
          className="mx-auto mb-6 max-w-2xl rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]"
        >
          {dataError ?? loadError}
        </div>
      ) : null}

      {loading ? (
        <DashboardSkeleton />
      ) : loadError ? null : !hasDebts ? (
        <div className="reveal mx-auto max-w-2xl py-10 text-center sm:py-16">
          <p className="kicker">A calm plan to reach zero</p>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Let&apos;s build your plan
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Add your first card or debt — the balance, rate, and minimum. We&apos;ll
            show the exact date you&apos;re free.
          </p>
          <Card className="mt-8 p-6 text-left sm:p-8">
            <DebtForm onAdd={addDebt} atLimit={atLimit} onLimit={hitDebtLimit} />
          </Card>
        </div>
      ) : (
        <>
          <header className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Your money at a glance</p>
              <div className="mt-3 flex items-center gap-3">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {tab === "overview"
                    ? firstName
                      ? `Welcome, ${firstName}`
                      : "Dashboard"
                    : "Payoff plan"}
                </h1>
                {tab === "overview" && isPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/30 bg-[var(--brand)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                    <span className="text-[10px]">✦</span> Pro
                  </span>
                ) : null}
              </div>
            </div>
            {/* tab switch */}
            <div className="inline-flex rounded-xl border border-[var(--border)] p-1">
              {(
                [
                  ["overview", "Overview"],
                  ["plan", "Plan"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    tab === key
                      ? "bg-[var(--brand)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          {tab === "overview" ? (
            <div className="reveal">
              <Dashboard
                debts={debts}
                payments={payments}
                plan={plan}
                now={now}
                onLogPayment={setPayingDebt}
                onAdd={addDebt}
                onOpenImport={() => setImporting(true)}
                atLimit={atLimit}
                onLimit={hitDebtLimit}
                isPro={isPro}
                freeLimit={limits.maxDebts}
              />
            </div>
          ) : (
            <div className="reveal space-y-5">
              {/* controls */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
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
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    {strategy === "avalanche"
                      ? "Targets the highest interest rate first — pays the least interest."
                      : "Targets the smallest balance first — quickest wins for motivation."}
                  </p>
                </Card>

                <Card className="p-5">
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
                    {format(minSum)} in minimums
                    {extra > 0 ? (
                      <>
                        {" + "}
                        {format(extra)} extra ={" "}
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
                      Saves{" "}
                      <span className="font-semibold text-[var(--accent)]">
                        {format(interestSaved)}
                      </span>
                      {monthsSaved > 0 ? (
                        <>
                          {" "}
                          and{" "}
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
                </Card>
              </div>

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

              <button
                onClick={() => {
                  if (confirm("Clear all debts and payments and start over?")) {
                    void clearAll();
                  }
                }}
                className="text-xs text-[var(--muted)] underline-offset-2 hover:underline"
              >
                Clear everything
              </button>
            </div>
          )}
        </>
      )}

      <footer className="mt-12 text-center text-xs text-[var(--muted)]">
        Estimates only. Interest is compounded monthly and assumes fixed
        balances and rates. Not financial advice.
      </footer>
    </main>
  );
}
