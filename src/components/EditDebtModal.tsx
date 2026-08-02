"use client";

import { useEffect, useState } from "react";
import type { Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";

export function EditDebtModal({
  debt,
  onClose,
  onSave,
}: {
  debt: Debt; // mounted per-debt (keyed) by the parent
  onClose: () => void;
  onSave: (updated: Debt) => void;
}) {
  const { currency } = useMoney();
  // Derived from the debt at mount time (parent remounts via `key`).
  const [name, setName] = useState(debt.name);
  const [balance, setBalance] = useState(String(debt.balance));
  const [apr, setApr] = useState(String(debt.apr));
  const [minPayment, setMinPayment] = useState(String(debt.minPayment));
  const [error, setError] = useState<string | null>(null);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const b = parseFloat(balance);
    const a = parseFloat(apr);
    const m = parseFloat(minPayment);

    if (!name.trim()) return setError("Give the debt a name.");
    if (!(b >= 0)) return setError("Balance can't be negative.");
    if (isNaN(a) || a < 0) return setError("Enter a valid interest rate.");
    if (!(m >= 0)) return setError("Enter a valid minimum payment.");

    onSave({
      ...debt,
      name: name.trim(),
      balance: b,
      // Keep progress sane: if the balance was corrected upward past the
      // original, treat the new figure as the starting point.
      startingBalance: Math.max(debt.startingBalance, b),
      apr: a,
      minPayment: m,
    });
  }

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";
  const labelCls = "block text-xs font-medium text-[var(--muted)] mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold">Edit debt</h3>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Update the details for this debt.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className={labelCls} htmlFor="edit-name">
              Debt name
            </label>
            <input
              id="edit-name"
              autoFocus
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="edit-balance">
              Current balance ({currency.code})
            </label>
            <input
              id="edit-balance"
              className={field}
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="edit-apr">
                APR %
              </label>
              <input
                id="edit-apr"
                className={field}
                inputMode="decimal"
                value={apr}
                onChange={(e) => setApr(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="edit-min">
                Min / mo
              </label>
              <input
                id="edit-min"
                className={field}
                inputMode="decimal"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
              />
            </div>
          </div>

          {error ? (
            <p className="text-xs font-medium text-[var(--danger)]">{error}</p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--background)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
