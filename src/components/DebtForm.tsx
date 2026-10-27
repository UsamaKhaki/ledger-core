"use client";

import { useState } from "react";
import type { DebtInput, DebtKind } from "@/lib/types";
import { DEBT_KINDS, isCardKind } from "@/lib/cards";
import { toNumber } from "@/lib/importCsv";

type Draft = {
  name: string;
  issuer: string;
  kind: DebtKind;
  balance: string;
  creditLimit: string;
  apr: string;
  minPayment: string;
  dueDay: string;
};

const empty: Draft = {
  name: "",
  issuer: "",
  kind: "credit_card",
  balance: "",
  creditLimit: "",
  apr: "",
  minPayment: "",
  dueDay: "",
};

const field =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[15px] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/25 placeholder:text-[var(--muted)]/45";
const errorRing =
  "!border-[var(--danger)] focus:!border-[var(--danger)] focus:!ring-[var(--danger)]/25";
const labelCls = "mb-1.5 block text-[13px] font-medium text-[var(--muted)]";

export function DebtForm({
  onAdd,
  atLimit = false,
  onLimit,
}: {
  onAdd: (d: DebtInput) => void;
  atLimit?: boolean;
  onLimit?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<keyof Draft | null>(null);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (error) {
      setError(null);
      setErrorField(null);
    }
  };
  const cls = (key: keyof Draft) =>
    errorField === key ? `${field} ${errorRing}` : field;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) return onLimit?.();

    const balance = toNumber(draft.balance) ?? NaN;
    const apr = toNumber(draft.apr) ?? NaN;
    const minPayment = toNumber(draft.minPayment) ?? NaN;
    const creditLimit = draft.creditLimit ? (toNumber(draft.creditLimit) ?? NaN) : null;
    const dueDay = draft.dueDay ? (toNumber(draft.dueDay) ?? NaN) : null;

    const fail = (key: keyof Draft, msg: string) => {
      setErrorField(key);
      setError(msg);
    };

    if (!draft.name.trim()) return fail("name", "Enter a name.");
    if (!(balance > 0)) return fail("balance", "Enter a balance greater than 0.");
    if (isNaN(apr) || apr < 0) return fail("apr", "Enter a valid interest rate.");
    if (!(minPayment >= 0))
      return fail("minPayment", "Enter a valid minimum payment.");
    if (creditLimit !== null && !(creditLimit > 0))
      return fail("creditLimit", "Credit limit must be greater than 0.");
    if (dueDay !== null && !(Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31))
      return fail("dueDay", "Due day must be between 1 and 31.");

    onAdd({
      name: draft.name.trim(),
      kind: draft.kind,
      issuer: draft.issuer.trim() || null,
      balance,
      apr,
      minPayment,
      creditLimit,
      dueDay,
    });
    setDraft(empty);
    setError(null);
    setErrorField(null);
  }

  const showLimit = isCardKind(draft.kind);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="d-name">
            Name
          </label>
          <input
            id="d-name"
            className={cls("name")}
            placeholder="Sapphire Visa"
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="d-issuer">
            Issuer <span className="opacity-60">(optional)</span>
          </label>
          <input
            id="d-issuer"
            className={field}
            placeholder="Chase"
            value={draft.issuer}
            onChange={(e) => set({ issuer: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="d-kind">
          Type
        </label>
        <select
          id="d-kind"
          className={`${field} appearance-none`}
          value={draft.kind}
          onChange={(e) => set({ kind: e.target.value as DebtKind })}
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls} htmlFor="d-balance">
            Balance
          </label>
          <input
            id="d-balance"
            className={cls("balance")}
            inputMode="decimal"
            placeholder="5000"
            value={draft.balance}
            onChange={(e) => set({ balance: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="d-apr">
            APR %
          </label>
          <input
            id="d-apr"
            className={cls("apr")}
            inputMode="decimal"
            placeholder="19.99"
            value={draft.apr}
            onChange={(e) => set({ apr: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="d-min">
            Min / mo
          </label>
          <input
            id="d-min"
            className={cls("minPayment")}
            inputMode="decimal"
            placeholder="120"
            value={draft.minPayment}
            onChange={(e) => set({ minPayment: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {showLimit ? (
          <div>
            <label className={labelCls} htmlFor="d-limit">
              Credit limit
            </label>
            <input
              id="d-limit"
              className={cls("creditLimit")}
              inputMode="decimal"
              placeholder="9000"
              value={draft.creditLimit}
              onChange={(e) => set({ creditLimit: e.target.value })}
            />
          </div>
        ) : null}
        <div className={showLimit ? "" : "col-span-2"}>
          <label className={labelCls} htmlFor="d-due">
            Due day <span className="opacity-60">(optional)</span>
          </label>
          <input
            id="d-due"
            className={cls("dueDay")}
            inputMode="numeric"
            placeholder="15"
            value={draft.dueDay}
            onChange={(e) => set({ dueDay: e.target.value })}
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-[var(--danger)]">{error}</p>
      ) : null}

      {atLimit ? (
        <button
          type="submit"
          className="mt-2 w-full rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3.5 text-[15px] font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
        >
          🔒 Upgrade to add more
        </button>
      ) : (
        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-[var(--brand)] px-4 py-3.5 text-[15px] font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
        >
          + Add
        </button>
      )}
    </form>
  );
}
