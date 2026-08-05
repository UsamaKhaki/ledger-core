"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Debt } from "@/lib/types";
import { useDebtsData } from "@/lib/useDebtsData";
import { useMoney } from "@/lib/CurrencyContext";
import { useNow } from "@/lib/useNow";
import {
  kindMeta,
  utilization,
  utilizationTone,
  dueInfo,
  isCardKind,
} from "@/lib/cards";
import { CardFace } from "@/components/CreditCardTile";
import { DetailSkeleton } from "@/components/Skeleton";
import { LogPaymentModal } from "@/components/LogPaymentModal";
import { EditDebtModal } from "@/components/EditDebtModal";
import { Card } from "@/components/ui";

const CONTAINER =
  "mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:w-4/5";

/** A themed ring gauge for utilization / payoff progress. */
function Gauge({
  pct,
  color,
  size = 148,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const stroke = 12;
  const shown = Math.min(100, Math.max(0, Math.round(pct)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - shown / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={`${shown}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className="stroke-[var(--border)]"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ stroke: color, transition: "stroke-dashoffset .5s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-display"
        style={{ fill: color, fontSize: size * 0.22, fontWeight: 700 }}
      >
        {shown}%
      </text>
    </svg>
  );
}

function Stat({
  label,
  value,
  sub,
  divide,
}: {
  label: string;
  value: string;
  sub?: string;
  divide?: boolean;
}) {
  return (
    <div className={divide ? "sm:border-l sm:border-[var(--border)] sm:pl-5" : ""}>
      <dt className="kicker">{label}</dt>
      <dd className="font-display mt-1.5 text-xl font-bold tracking-tight [overflow-wrap:anywhere]">
        {value}
      </dd>
      {sub ? <dd className="mt-0.5 text-xs text-[var(--muted)]">{sub}</dd> : null}
    </div>
  );
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { debts, payments, loading, saveDebt, removeDebt, logPayment } =
    useDebtsData();
  const { format } = useMoney();
  const now = useNow();
  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);

  const debt = debts.find((d) => d.id === id);
  const debtPayments = payments.filter((p) => p.debtId === id);

  if (loading) {
    return (
      <main className={CONTAINER}>
        <DetailSkeleton />
      </main>
    );
  }

  if (!debt) {
    return (
      <main className={CONTAINER}>
        <Card className="p-8 text-center">
          <p className="text-sm text-[var(--muted)]">This item no longer exists.</p>
          <Link
            href="/app"
            className="mt-3 inline-block text-sm font-medium text-[var(--brand)] hover:underline"
          >
            ← Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  const meta = kindMeta(debt.kind);
  const isCard = isCardKind(debt.kind);
  const util = utilization(debt);
  const start = Math.max(debt.startingBalance, debt.balance, 1);
  const paid = Math.max(0, start - debt.balance);
  const paidPct = Math.round((paid / start) * 100);
  const due = debt.dueDay != null && now != null ? dueInfo(debt.dueDay, now) : null;
  const cleared = debt.balance <= 0.005;
  const available =
    debt.creditLimit && debt.creditLimit > 0
      ? Math.max(0, debt.creditLimit - debt.balance)
      : null;

  async function onSave(updated: Debt) {
    await saveDebt(updated.id, {
      name: updated.name,
      kind: updated.kind,
      issuer: updated.issuer,
      balance: updated.balance,
      apr: updated.apr,
      minPayment: updated.minPayment,
      creditLimit: updated.creditLimit,
      dueDay: updated.dueDay,
    });
    setEditing(false);
  }

  // Hero stats — complementary to the card face (no balance/util repeat for cards).
  const heroStats = isCard
    ? [
        available != null
          ? { label: "Available", value: format(available), sub: "left to spend" }
          : { label: "Balance", value: format(debt.balance), sub: "owed now" },
        { label: "APR", value: `${debt.apr}%`, sub: "annual rate" },
        { label: "Min / mo", value: format(debt.minPayment), sub: due ? `due ${due.ordinal}` : "monthly" },
        { label: "Paid so far", value: format(paid), sub: `of ${format(start)}` },
      ]
    : [
        { label: "Balance", value: format(debt.balance), sub: "owed now" },
        { label: "APR", value: `${debt.apr}%`, sub: "annual rate" },
        { label: "Min / mo", value: format(debt.minPayment), sub: due ? `due ${due.ordinal}` : "monthly" },
        { label: "Original", value: format(debt.startingBalance), sub: "when opened" },
      ];

  return (
    <main className={CONTAINER}>
      {paying ? (
        <LogPaymentModal
          key={debt.id}
          debt={debt}
          onClose={() => setPaying(false)}
          onConfirm={async (debtId, amount) => {
            await logPayment(debtId, amount);
            setPaying(false);
          }}
        />
      ) : null}
      {editing ? (
        <EditDebtModal
          key={debt.id}
          debt={debt}
          onClose={() => setEditing(false)}
          onSave={onSave}
        />
      ) : null}

      <Link
        href="/app"
        className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        ← All cards &amp; debts
      </Link>

      {/* ── Hero: the card itself (or a payoff gauge for loans) ── */}
      <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center">
        {isCard ? (
          <CardFace debt={debt} now={now} className="max-w-[420px] lg:w-[400px]" />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {debt.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {debt.issuer ? `${debt.issuer} · ` : ""}
                {meta.label}
                {cleared ? " · Paid off ✓" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!cleared ? (
                <button
                  onClick={() => setPaying(true)}
                  className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Log payment
                </button>
              ) : null}
              <button
                onClick={() => setEditing(true)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--elevate)]"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Remove ${debt.name}?`)) {
                    await removeDebt(debt.id);
                    router.push("/app");
                  }
                }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
              >
                Remove
              </button>
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-y-6 border-t border-[var(--border)] pt-6 sm:grid-cols-4">
            {heroStats.map((s, i) => (
              <Stat key={s.label} {...s} divide={i > 0} />
            ))}
          </dl>
        </div>
      </div>

      {/* ── Detail sections ── */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {isCard ? (
          <Card className="flex h-full flex-col p-6">
            <h2 className="kicker mb-4">Credit utilization</h2>
            <div className="flex flex-1 items-center gap-6">
              <Gauge
                pct={util ?? 0}
                color={util != null ? utilizationTone(util) : "var(--muted)"}
              />
              <div className="min-w-0">
                {available != null ? (
                  <>
                    <p className="font-display text-2xl font-bold tracking-tight">
                      {format(available)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">available to spend</p>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Using{" "}
                      <span className="font-semibold text-[var(--foreground)]">
                        {format(debt.balance)}
                      </span>{" "}
                      of {format(debt.creditLimit ?? 0)}.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    Add a credit limit (Edit) to track utilization.
                  </p>
                )}
                {util != null ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {util < 30
                      ? "Healthy — under 30% helps your credit score."
                      : util < 75
                        ? "Moderate — getting below 30% is a good next target."
                        : "High — this weighs on your credit score."}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex h-full flex-col p-6">
            <h2 className="kicker mb-4">Payoff progress</h2>
            <div className="flex flex-1 items-center gap-6">
              <Gauge pct={cleared ? 100 : paidPct} color="var(--success)" />
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold tracking-tight">
                  {format(paid)}
                </p>
                <p className="text-xs text-[var(--muted)]">paid off so far</p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Remaining{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {format(debt.balance)}
                  </span>{" "}
                  of {format(start)}.
                </p>
                {cleared ? (
                  <p className="mt-2 text-xs text-[var(--success)]">Cleared 🎉</p>
                ) : due ? (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Next payment {due.label.toLowerCase()}.
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="kicker mb-4">Details</h2>
          <dl className="space-y-3 text-sm">
            {(
              [
                ["Type", meta.label],
                ["Issuer", debt.issuer || "—"],
                ...(isCard
                  ? ([
                      ["Credit limit", debt.creditLimit ? format(debt.creditLimit) : "—"],
                      ["Available", available != null ? format(available) : "—"],
                    ] as [string, string][])
                  : []),
                ["Minimum / mo", format(debt.minPayment)],
                ["Payment due", due ? `${due.ordinal} · ${due.label}` : "—"],
                ["Original balance", format(debt.startingBalance)],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--border)]/60 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-[var(--muted)]">{k}</dt>
                <dd className="font-mono-num text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* ── Payment history ── */}
      <Card className="mt-4 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="kicker">Payment history</h2>
          {debtPayments.length > 0 ? (
            <span className="text-xs text-[var(--muted)]">
              {debtPayments.length} payment{debtPayments.length === 1 ? "" : "s"} ·{" "}
              {format(debtPayments.reduce((s, p) => s + p.amount, 0))} total
            </span>
          ) : null}
        </div>
        {debtPayments.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">
            No payments logged yet.{" "}
            {!cleared ? (
              <button
                onClick={() => setPaying(true)}
                className="font-semibold text-[var(--brand)] hover:underline"
              >
                Log your first
              </button>
            ) : null}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {debtPayments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
              >
                <span className="text-[var(--muted)]">
                  {new Date(p.dateISO).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {p.clearedDebt ? " · cleared 🎉" : ""}
                </span>
                <span className="font-mono-num font-semibold text-[var(--success)]">
                  {format(p.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
