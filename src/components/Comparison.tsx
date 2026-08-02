"use client";

import type { PlanResult, Strategy } from "@/lib/types";
import { formatDuration } from "@/lib/debt";
import { useMoney } from "@/lib/CurrencyContext";
import { StrategyBars, type StrategyBar } from "./graphics";
import { Card } from "./ui";

export function Comparison({
  avalanche,
  snowball,
  active,
}: {
  avalanche: PlanResult;
  snowball: PlanResult;
  active: Strategy;
}) {
  const { format } = useMoney();
  if (!avalanche.feasible || !snowball.feasible) return null;

  const interestDiff = snowball.totalInterest - avalanche.totalInterest;
  const monthsDiff = snowball.months - avalanche.months;

  // color the cheaper strategy green, the pricier one gold
  const avaCheaper = avalanche.totalInterest <= snowball.totalInterest;
  const bars: StrategyBar[] = [
    {
      label: "❄️ Avalanche",
      value: avalanche.totalInterest,
      display: format(avalanche.totalInterest),
      tone: avaCheaper ? "var(--success)" : "var(--accent)",
    },
    {
      label: "⛄ Snowball",
      value: snowball.totalInterest,
      display: format(snowball.totalInterest),
      tone: avaCheaper ? "var(--accent)" : "var(--success)",
    },
  ];

  const legend = [
    { key: "avalanche" as const, name: "❄️ Avalanche", plan: avalanche },
    { key: "snowball" as const, name: "⛄ Snowball", plan: snowball },
  ];

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="kicker">Which strategy wins?</h3>
        <span className="text-xs text-[var(--muted)]">Total interest paid</span>
      </div>

      {/* animated comparison bars on real numbers (re-animate on change) */}
      <StrategyBars
        key={`${Math.round(avalanche.totalInterest)}-${Math.round(
          snowball.totalInterest,
        )}`}
        bars={bars}
        height={160}
      />

      {/* slim legend, no boxes */}
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4 text-sm">
        {legend.map((l) => (
          <div key={l.key} className="space-y-1">
            <p
              className={`font-display text-sm font-semibold ${
                l.key === active ? "text-[var(--brand)]" : ""
              }`}
            >
              {l.name}
              {l.key === active ? (
                <span className="kicker ml-2 !text-[var(--brand)]">Active</span>
              ) : null}
            </p>
            <div className="flex items-baseline justify-between text-xs text-[var(--muted)]">
              <span>Debt-free in</span>
              <span className="font-mono-num text-[var(--foreground)]">
                {formatDuration(l.plan.months)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(interestDiff > 1 || monthsDiff > 0) && (
        <p className="mt-4 border-l-2 border-[var(--success)] bg-[var(--success)]/8 px-3 py-2.5 text-xs leading-relaxed text-[var(--foreground)]">
          <span className="font-semibold text-[var(--success)]">Avalanche</span>{" "}
          saves you{" "}
          <span className="font-mono-num font-semibold">
            {format(Math.max(0, interestDiff))}
          </span>{" "}
          in interest
          {monthsDiff > 0 ? (
            <>
              {" "}
              and clears your debt{" "}
              <span className="font-semibold">{monthsDiff} mo</span> sooner
            </>
          ) : null}{" "}
          versus Snowball — but Snowball pays off your first debt faster for quick
          motivation.
        </p>
      )}
    </Card>
  );
}
