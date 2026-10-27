"use client";

import { Modal } from "./Modal";
import Link from "next/link";
import { track } from "@/lib/analytics";
import {
  PRICING,
  yearlyMonthlyEquivalent,
  yearlySavingsPct,
} from "@/lib/tiers";

const PRO_PERKS = [
  "Track unlimited debts",
  "Full month-by-month amortization schedule",
  "Export your plan to CSV",
  "Payment reminders & cloud sync (coming soon)",
  "Priority support",
];

export function UpgradeModal({
  reason,
  onClose,
}: {
  reason: string | null;
  onClose: () => void;
}) {
  if (!reason) return null;

  return (
    <Modal onClose={onClose} panelClassName="w-full max-w-md overflow-hidden">
      {({ titleId }) => (
        <>
        <div className="border-b border-[var(--border)] bg-[var(--brand-soft)]/50 px-6 py-5">
          <p className="kicker !text-[var(--brand)]">Ledger Pro</p>
          <h3
            id={titleId}
            className="font-display mt-1 text-2xl font-semibold tracking-tight"
          >
            Go Pro to keep going
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{reason}</p>
        </div>

        <div className="px-6 py-5">
          <ul className="space-y-2">
            {PRO_PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-[var(--success)]">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold tracking-tight">
              ${yearlyMonthlyEquivalent}
            </span>
            <span className="text-sm text-[var(--muted)]">
              /mo billed yearly · or ${PRICING.monthlyPrice}/mo · save{" "}
              {yearlySavingsPct}%
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--background)]"
            >
              Not now
            </button>
            <Link
              href="/pricing"
              onClick={() => track("click_upgrade", { reason })}
              className="flex-1 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
            >
              See plans
            </Link>
          </div>
        </div>
        </>
      )}
    </Modal>
  );
}
