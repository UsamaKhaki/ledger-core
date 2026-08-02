"use client";

import { useState } from "react";
import type { Debt } from "@/lib/types";

type Draft = {
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
};

const empty: Draft = { name: "", balance: "", apr: "", minPayment: "" };

export function DebtForm({
  onAdd,
  atLimit = false,
  onLimit,
}: {
  onAdd: (d: Debt) => void;
  atLimit?: boolean;
  onLimit?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) {
      onLimit?.();
      return;
    }
    const balance = parseFloat(draft.balance);
    const apr = parseFloat(draft.apr);
    const minPayment = parseFloat(draft.minPayment);

    if (!draft.name.trim()) return setError("Give the debt a name.");
    if (!(balance > 0)) return setError("Balance must be greater than 0.");
    if (isNaN(apr) || apr < 0) return setError("Enter a valid interest rate.");
    if (!(minPayment >= 0)) return setError("Enter a valid minimum payment.");

    onAdd({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.floor(performance.now())}`,
      name: draft.name.trim(),
      balance,
      startingBalance: balance,
      apr,
      minPayment,
    });
    setDraft(empty);
    setError(null);
  }

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";
  const labelCls = "block text-xs font-medium text-[var(--muted)] mb-1";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className={labelCls} htmlFor="name">
          Debt name
        </label>
        <input
          id="name"
          className={field}
          placeholder="e.g. Visa credit card"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="balance">
            Balance
          </label>
          <input
            id="balance"
            className={field}
            inputMode="decimal"
            placeholder="5000"
            value={draft.balance}
            onChange={(e) => setDraft({ ...draft, balance: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="apr">
            APR %
          </label>
          <input
            id="apr"
            className={field}
            inputMode="decimal"
            placeholder="19.99"
            value={draft.apr}
            onChange={(e) => setDraft({ ...draft, apr: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="min">
            Min / mo
          </label>
          <input
            id="min"
            className={field}
            inputMode="decimal"
            placeholder="120"
            value={draft.minPayment}
            onChange={(e) =>
              setDraft({ ...draft, minPayment: e.target.value })
            }
          />
        </div>
      </div>
      {error ? (
        <p className="text-xs font-medium text-[var(--danger)]">{error}</p>
      ) : null}
      {atLimit ? (
        <button
          type="submit"
          className="w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
        >
          🔒 Upgrade to add more debts
        </button>
      ) : (
        <button
          type="submit"
          className="w-full rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
        >
          + Add debt
        </button>
      )}
    </form>
  );
}
