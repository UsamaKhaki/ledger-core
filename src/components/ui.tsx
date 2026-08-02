import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass rounded-2xl [box-shadow:var(--shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

type Accent = "brand" | "success" | "danger" | "accent";

const ACCENT_TEXT: Record<Accent, string> = {
  brand: "text-[var(--brand)]",
  success: "text-[var(--success)]",
  danger: "text-[var(--danger)]",
  accent: "text-[var(--accent)]",
};
const ACCENT_BG: Record<Accent, string> = {
  brand: "bg-[var(--brand)]",
  success: "bg-[var(--success)]",
  danger: "bg-[var(--danger)]",
  accent: "bg-[var(--accent)]",
};

export type Stat = {
  label: string;
  value: string;
  sub?: string;
  accent?: Accent;
};

/** Borderless, hairline-divided row of key figures (less boxy than cards). */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
      {stats.map((s, i) => {
        const accent = s.accent ?? "brand";
        return (
          <div
            key={s.label}
            className={`min-w-0 px-1 sm:px-5 ${
              i % 2 === 1 ? "border-l border-[var(--border)] pl-4 sm:pl-5" : ""
            } ${i > 0 ? "sm:border-l sm:border-[var(--border)]" : ""}`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${ACCENT_BG[accent]}`}
              />
              <span className="kicker truncate">{s.label}</span>
            </div>
            <p
              className={`font-display mt-2 text-2xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-3xl ${ACCENT_TEXT[accent]}`}
            >
              {s.value}
            </p>
            {s.sub ? (
              <p className="mt-1 truncate text-xs text-[var(--muted)]">{s.sub}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
