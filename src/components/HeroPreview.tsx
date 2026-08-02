"use client";

import { BalanceGraphic } from "./graphics";

/**
 * Polished, product-specific hero visual: a single self-contained glass
 * "dashboard" of the real planner. Everything lives inside the panel so
 * nothing overlaps.
 */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md [perspective:1700px] sm:max-w-lg">
      {/* soft glow behind the panel */}
      <div className="absolute inset-8 -z-10 rounded-[2.5rem] bg-[var(--brand)]/25 blur-3xl" />

      <div className="glass floaty overflow-hidden rounded-3xl [box-shadow:var(--shadow)] lg:[transform:rotateY(-9deg)_rotateX(3deg)]">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]/70" />
          <span className="kicker ml-2">Your payoff plan</span>
          <span className="ml-auto rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] ring-1 ring-white/10">
            ❄️ Avalanche
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {/* headline stats */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                Debt-free by
              </p>
              <p className="font-display text-3xl font-bold tracking-tight text-[var(--success)] sm:text-4xl">
                Mar 2028
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
                Interest saved
              </p>
              <p className="font-display text-xl font-bold text-[var(--accent)]">
                $1,840
              </p>
            </div>
          </div>

          {/* chart (labels off — the panel supplies context) */}
          <div className="mt-5">
            <BalanceGraphic showLabels={false} />
          </div>

          {/* progress footer */}
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <div className="mb-2 flex items-baseline justify-between text-xs">
              <span className="text-[var(--muted)]">Your progress</span>
              <span className="font-mono-num font-semibold">
                68% · 1 of 3 cleared
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--success)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
