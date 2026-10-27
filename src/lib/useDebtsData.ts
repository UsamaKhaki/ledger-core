"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Debt, DebtInput, Payment } from "@/lib/types";

/**
 * Planner data (debts + payments) sourced from the API. Today the API is backed
 * by in-memory fixtures; later it's Supabase — this hook doesn't change.
 */
/** Pull the server's `{ error }` message out of any non-200 body. */
function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as { error?: unknown }).error;
    if (typeof e === "string" && e) return e;
  }
  return fallback;
}

export function useDebtsData() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  /** Set when the initial load fails — so a backend outage reads as an error
   *  and not as "you have no debts". */
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, p] = await Promise.all([
          api.debts.list(),
          api.payments.list(),
        ]);
        if (cancelled) return;
        if (d.status === 200 && p.status === 200) {
          setDebts(d.body.debts);
          setPayments(p.body.payments);
          setLoadError(null);
        } else {
          const failed = d.status !== 200 ? d : p;
          setLoadError(
            messageFrom(
              failed.body,
              "We couldn't load your data. Check your connection and refresh.",
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            "We couldn't reach the server. Check your connection and refresh.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addDebt = useCallback(async (input: DebtInput) => {
    const res = await api.debts.create({ body: input });
    if (res.status === 200) {
      setDebts((cur) => [...cur, res.body.debt]);
      return { error: null };
    }
    return { error: messageFrom(res.body, "Could not add debt.") };
  }, []);

  const saveDebt = useCallback(
    async (id: string, patch: Partial<DebtInput>) => {
      const res = await api.debts.update({ params: { id }, body: patch });
      if (res.status === 200) {
        const updated = res.body.debt;
        setDebts((cur) => cur.map((d) => (d.id === id ? updated : d)));
        return { error: null };
      }
      return { error: messageFrom(res.body, "Could not save your changes.") };
    },
    [],
  );

  const removeDebt = useCallback(async (id: string) => {
    const res = await api.debts.remove({ params: { id } });
    // Only drop it from the UI once the server confirms — otherwise a failed
    // delete looks successful until the next refresh brings the debt back.
    if (res.status !== 200 || !res.body.ok) {
      return { error: messageFrom(res.body, "Could not delete that debt.") };
    }
    setDebts((cur) => cur.filter((d) => d.id !== id));
    setPayments((cur) => cur.filter((p) => p.debtId !== id));
    return { error: null };
  }, []);

  const clearAll = useCallback(async () => {
    const res = await api.debts.clear();
    if (res.status !== 200) {
      return { error: messageFrom(res.body, "Could not clear your data.") };
    }
    setDebts([]);
    setPayments([]);
    return { error: null };
  }, []);

  const logPayment = useCallback(async (debtId: string, amount: number) => {
    const res = await api.payments.log({ body: { debtId, amount } });
    if (res.status !== 200) {
      return {
        ok: false as const,
        error: messageFrom(res.body, "Could not log that payment."),
      };
    }
    const { payment, debt, cleared } = res.body;
    setDebts((cur) => cur.map((d) => (d.id === debt.id ? debt : d)));
    setPayments((cur) => [payment, ...cur]);
    return { ok: true as const, cleared, debt };
  }, []);

  return {
    debts,
    payments,
    loading,
    loadError,
    addDebt,
    saveDebt,
    removeDebt,
    clearAll,
    logPayment,
  };
}
