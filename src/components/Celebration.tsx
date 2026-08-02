"use client";

import { useEffect } from "react";

const COLORS = [
  "#4f46e5",
  "#0d9f6e",
  "#f59e0b",
  "#e5484d",
  "#7c74ff",
  "#34d399",
];

export type ConfettiPiece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
};

export type CelebrationState = {
  title: string;
  subtitle: string;
  big: boolean; // true = fully debt-free (more confetti, bigger card)
  pieces: ConfettiPiece[];
} | null;

/**
 * Build the confetti spec. Called from event handlers (not during render) so
 * the randomness stays out of the render path.
 */
export function makeConfetti(big: boolean): ConfettiPiece[] {
  const count = big ? 90 : 45;
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.4 + Math.random() * 1.6,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));
}

export function Celebration({
  state,
  onDone,
}: {
  state: CelebrationState;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!state) return;
    const t = setTimeout(onDone, state.big ? 6000 : 4000);
    return () => clearTimeout(t);
  }, [state, onDone]);

  if (!state) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      role="status"
      aria-live="polite"
    >
      {state.pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 top-24 flex justify-center px-4">
        <div className="pointer-events-auto animate-[pop_0.35s_ease-out] rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] px-6 py-5 text-center shadow-xl">
          <div className="text-4xl">{state.big ? "🎉" : "✅"}</div>
          <p className="mt-2 text-lg font-bold">{state.title}</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">{state.subtitle}</p>
          <button
            onClick={onDone}
            className="mt-3 rounded-xl bg-[var(--brand)] px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {state.big ? "🥳 Amazing!" : "Keep going"}
          </button>
        </div>
      </div>
    </div>
  );
}
