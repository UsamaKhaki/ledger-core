"use client";

import Link from "next/link";
import type { Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";
import { kindMeta, utilization, dueInfo } from "@/lib/cards";

// Self-contained colored tiles (light text on a gradient) so a card reads like
// a real card in both light and dark themes. Picked deterministically per debt.
const GRADIENTS = [
  "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)", // indigo → violet
  "linear-gradient(135deg,#0f766e 0%,#059669 100%)", // teal → emerald
  "linear-gradient(135deg,#334155 0%,#0f172a 100%)", // slate
  "linear-gradient(135deg,#b45309 0%,#f59e0b 100%)", // amber
  "linear-gradient(135deg,#9f1239 0%,#f43f5e 100%)", // rose
  "linear-gradient(135deg,#1e40af 0%,#3b82f6 100%)", // blue
];

export function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

// Light tints that stay legible on any colored tile.
function ringTone(pct: number): string {
  if (pct < 30) return "#6ee7b7";
  if (pct < 75) return "#fcd34d";
  return "#fca5a5";
}

function Chip() {
  return (
    <span className="relative block h-7 w-10 shrink-0 overflow-hidden rounded-[6px] bg-gradient-to-b from-[#f0d79a] to-[#b8923f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]">
      <span className="absolute inset-[4px] rounded-[3px] border border-black/20" />
      <span className="absolute inset-x-[3px] top-1/2 h-px -translate-y-1/2 bg-black/20" />
      <span className="absolute inset-x-[3px] top-[7px] h-px bg-black/15" />
      <span className="absolute inset-x-[3px] bottom-[7px] h-px bg-black/15" />
    </span>
  );
}

function UtilRing({ pct }: { pct: number }) {
  const shown = Math.min(100, pct);
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - shown / 100);
  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={ringTone(pct)}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/** The card visual (no link). Reused as the dashboard tile and the detail hero. */
export function CardFace({
  debt,
  now,
  className = "",
}: {
  debt: Debt;
  now: number | null;
  className?: string;
}) {
  const { format } = useMoney();
  const meta = kindMeta(debt.kind);
  const util = utilization(debt);
  const due = debt.dueDay != null && now != null ? dueInfo(debt.dueDay, now) : null;
  const cleared = debt.balance <= 0.005;
  const tag = debt.kind === "store_card" ? "STORE" : "CREDIT";

  return (
    <div
      className={`relative aspect-[1.585/1] w-full overflow-hidden rounded-2xl p-5 text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.55)] ${className}`}
      style={{ background: gradientFor(debt.id) }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 90% at 100% -20%, rgba(255,255,255,0.22), transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold uppercase tracking-wide">
              {debt.issuer || debt.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/70">
              {debt.issuer ? debt.name : meta.label}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-widest backdrop-blur-sm">
            {cleared ? "PAID" : tag}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Chip />
          <span className="font-mono-num text-[15px] tracking-[0.3em] text-white/55">
            •••• ••••
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[26px] font-bold leading-none tracking-tight [overflow-wrap:anywhere]">
              {format(debt.balance)}
            </p>
            <p className="mt-1.5 text-xs text-white/70">
              {debt.apr}% APR
              {due ? (
                <>
                  {" · "}
                  <span className={due.daysUntil <= 3 ? "font-semibold text-white" : ""}>
                    {due.label}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          {util != null ? (
            <div className="shrink-0 text-center">
              <div className="relative mx-auto h-11 w-11">
                <UtilRing pct={util} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                  {util}%
                </span>
              </div>
              <p className="mt-1 whitespace-nowrap text-[10px] text-white/70">
                of {format(debt.creditLimit ?? 0)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Dashboard tile — the card visual wrapped in a link to its detail page. */
export function CreditCardTile({ debt, now }: { debt: Debt; now: number | null }) {
  return (
    <Link
      href={`/app/debt/${debt.id}`}
      className="card-hover block w-full rounded-2xl"
      aria-label={`${debt.name} details`}
    >
      <CardFace debt={debt} now={now} />
    </Link>
  );
}
