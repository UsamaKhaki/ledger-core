"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { Debt } from "@/lib/types";
import { useMoney } from "@/lib/CurrencyContext";

export function LogPaymentModal({
  debt,
  onClose,
  onConfirm,
}: {
  debt: Debt; // mounted per-debt (keyed) by the parent
  onClose: () => void;
  onConfirm: (debtId: string, amount: number) => void;
}) {
  const { format, currency } = useMoney();
  // Derived from the debt at mount time (parent remounts via `key`).
  const [amount, setAmount] = useState(
    debt.minPayment > 0 ? String(debt.minPayment) : "",
  );
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!(value > 0)) return setError("Enter an amount greater than 0.");
    onConfirm(debt.id, value);
  }

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[15px] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";

  return (
    <Modal onClose={onClose} panelClassName="w-full max-w-sm p-5">
      {({ titleId }) => (
        <>
        <h3 id={titleId} className="font-display text-xl font-semibold">
          Log a payment
        </h3>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          {debt.name} ·{" "}
          <span className="font-mono-num">{format(debt.balance)}</span> remaining
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label
              className="mb-1 block text-xs font-medium text-[var(--muted)]"
              htmlFor="pay-amount"
            >
              Payment amount ({currency.code})
            </label>
            <input
              id="pay-amount"
              autoFocus
              className={field}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[debt.minPayment, debt.balance].map((v, idx) =>
              v > 0 ? (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAmount(String(Math.round(v * 100) / 100))}
                  className="rounded-xl border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {idx === 0 ? "Minimum" : "Pay it off"} · {format(v)}
                </button>
              ) : null,
            )}
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
              Log payment
            </button>
          </div>
        </form>
        </>
      )}
    </Modal>
  );
}
