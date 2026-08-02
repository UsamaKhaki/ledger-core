"use client";

/* ---------------------------------------------------------------
   Decorative, data-flavoured SVG graphics used across the landing.
   All animate with CSS only (no JS, no external images).
   --------------------------------------------------------------- */

/** A self-drawing balance-declining area chart. */
export function BalanceGraphic({ showLabels = true }: { showLabels?: boolean }) {
  return (
    <div className="relative">
      <svg viewBox="0 0 420 260" className="w-full" role="img" aria-label="Balance declining over time">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fa6ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8fa6ff" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
          <filter id="balGlowG" x="-20%" y="-40%" width="140%" height="200%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="8"
              floodColor="#5b7cfa"
              floodOpacity="0.35"
            />
          </filter>
        </defs>

        {/* baseline grid (dashed, matching the payoff chart) */}
        {[60, 110, 160, 210].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="400"
            y2={y}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}

        {/* area under the curve */}
        <path
          d="M20,60 C110,80 150,150 220,175 C290,200 340,225 400,235 L400,235 L20,235 Z"
          fill="url(#areaFill)"
          opacity="0.9"
        />
        {/* the animated line */}
        <path
          pathLength={1}
          className="draw-path"
          d="M20,60 C110,80 150,150 220,175 C290,200 340,225 400,235"
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#balGlowG)"
        />

        {/* debt-free endpoint (stroked, matching the payoff chart) */}
        <circle
          cx="400"
          cy="235"
          r="6"
          fill="var(--success)"
          stroke="var(--surface-solid)"
          strokeWidth="2"
          className="floaty"
        />
        <circle cx="20" cy="60" r="5" fill="#8fa6ff" />
      </svg>

      {/* floating labels instead of boxes */}
      {showLabels ? (
        <>
          <span className="absolute left-2 top-2 rounded-full bg-white/5 px-3 py-1 text-xs text-[var(--muted)] ring-1 ring-white/10">
            Today
          </span>
          <span className="absolute bottom-8 right-2 rounded-full bg-[var(--success)]/15 px-3 py-1 text-xs font-semibold text-[var(--success)] ring-1 ring-[var(--success)]/30">
            Debt-free 🎉
          </span>
        </>
      ) : null}
    </div>
  );
}

/** Animated progress ring / donut with a center figure. */
export function ProgressRing({
  percent = 68,
  label = "paid off",
}: {
  percent?: number;
  label?: string;
}) {
  const r = 84;
  const c = 2 * Math.PI * r;
  const to = c * (1 - percent / 100);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <svg viewBox="0 0 200 200" className="w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          className="ring-anim"
          style={
            {
              ["--ring-from" as string]: `${c}`,
              ["--ring-to" as string]: `${to}`,
              strokeDashoffset: to,
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold tracking-tight">
          {percent}%
        </span>
        <span className="mt-1 text-xs text-[var(--muted)]">{label}</span>
      </div>
    </div>
  );
}

export type StrategyBar = {
  label: string;
  value: number; // raw amount, used for bar height
  display: string; // formatted amount to show
  tone: string; // CSS color
};

const DEFAULT_BARS: StrategyBar[] = [
  { label: "Avalanche", value: 2365, display: "$2,365", tone: "var(--success)" },
  { label: "Snowball", value: 3125, display: "$3,125", tone: "var(--accent)" },
];

/** Avalanche vs Snowball comparison bars (interest paid). */
export function StrategyBars({
  bars = DEFAULT_BARS,
  height = 192,
}: {
  bars?: StrategyBar[];
  height?: number;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex items-end justify-center gap-10 pt-6">
      {bars.map((d, i) => {
        // floor so a near-zero bar is still visible
        const pct = Math.max(8, Math.round((d.value / max) * 100));
        return (
          <div key={d.label} className="flex flex-col items-center">
            <span className="font-mono-num mb-2 text-sm font-semibold">
              {d.display}
            </span>
            <div className="flex items-end" style={{ height }}>
              <div
                className="grow-bar w-16 rounded-t-xl sm:w-20"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, ${d.tone}, transparent 160%)`,
                  animationDelay: `${i * 0.15}s`,
                  boxShadow: `0 -10px 40px -10px ${d.tone}`,
                }}
              />
            </div>
            <span className="mt-3 text-xs text-[var(--muted)]">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
