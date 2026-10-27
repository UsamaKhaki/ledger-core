"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { Debt, DebtKind } from "@/lib/types";
import { DEBT_KINDS, isCardKind } from "@/lib/cards";
import { useMoney } from "@/lib/CurrencyContext";
import { toNumber } from "@/lib/importCsv";

const field =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[15px] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20";
const labelCls = "mb-1.5 block text-[13px] font-medium text-[var(--muted)]";

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
  const [name, setName] = useState(debt.name);
  const [issuer, setIssuer] = useState(debt.issuer ?? "");
  const [kind, setKind] = useState<DebtKind>(debt.kind ?? "other");
  const [balance, setBalance] = useState(String(debt.balance));
  const [creditLimit, setCreditLimit] = useState(
    debt.creditLimit != null ? String(debt.creditLimit) : "",
  );
  const [apr, setApr] = useState(String(debt.apr));
  const [minPayment, setMinPayment] = useState(String(debt.minPayment));
  const [dueDay, setDueDay] = useState(debt.dueDay != null ? String(debt.dueDay) : "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const b = toNumber(balance) ?? NaN;
    const a = toNumber(apr) ?? NaN;
    const m = toNumber(minPayment) ?? NaN;
    const limit = creditLimit ? (toNumber(creditLimit) ?? NaN) : null;
    const due = dueDay ? (toNumber(dueDay) ?? NaN) : null;

    if (!name.trim()) return setError("Give it a name.");
    if (!(b >= 0)) return setError("Balance can't be negative.");
    if (isNaN(a) || a < 0) return setError("Enter a valid interest rate.");
    if (!(m >= 0)) return setError("Enter a valid minimum payment.");
    if (limit !== null && !(limit > 0))
      return setError("Credit limit must be greater than 0.");
    if (due !== null && !(Number.isInteger(due) && due >= 1 && due <= 31))
      return setError("Due day must be between 1 and 31.");

    onSave({
      ...debt,
      name: name.trim(),
      kind,
      issuer: issuer.trim() || null,
      balance: b,
      startingBalance: Math.max(debt.startingBalance, b),
      apr: a,
      minPayment: m,
      creditLimit: limit,
      dueDay: due,
    });
  }

  const showLimit = isCardKind(kind);

  return (
    <Modal onClose={onClose} panelClassName="w-full max-w-lg p-5">
      {({ titleId }) => (
        <>
        <h3
          id={titleId}
          className="font-display text-xl font-semibold tracking-tight"
        >
          Edit
        </h3>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Update the details for this card or debt.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="e-name">
                Name
              </label>
              <input
                id="e-name"
                autoFocus
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="e-issuer">
                Issuer
              </label>
              <input
                id="e-issuer"
                className={field}
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="e-kind">
              Type
            </label>
            <select
              id="e-kind"
              className={`${field} appearance-none`}
              value={kind}
              onChange={(e) => setKind(e.target.value as DebtKind)}
            >
              {DEBT_KINDS.map((k) => (
                <option
                  key={k.value}
                  value={k.value}
                  className="bg-[var(--surface-solid)]"
                >
                  {k.icon}  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} htmlFor="e-balance">
                Balance ({currency.code})
              </label>
              <input
                id="e-balance"
                className={field}
                inputMode="decimal"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="e-apr">
                APR %
              </label>
              <input
                id="e-apr"
                className={field}
                inputMode="decimal"
                value={apr}
                onChange={(e) => setApr(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="e-min">
                Min / mo
              </label>
              <input
                id="e-min"
                className={field}
                inputMode="decimal"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {showLimit ? (
              <div>
                <label className={labelCls} htmlFor="e-limit">
                  Credit limit
                </label>
                <input
                  id="e-limit"
                  className={field}
                  inputMode="decimal"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
              </div>
            ) : null}
            <div className={showLimit ? "" : "col-span-2"}>
              <label className={labelCls} htmlFor="e-due">
                Due day
              </label>
              <input
                id="e-due"
                className={field}
                inputMode="numeric"
                placeholder="15"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
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
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-[15px] font-semibold transition hover:bg-[var(--elevate)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-[var(--brand)] px-4 py-3 text-[15px] font-semibold text-white transition hover:opacity-90"
            >
              Save changes
            </button>
          </div>
        </form>
        </>
      )}
    </Modal>
  );
}
