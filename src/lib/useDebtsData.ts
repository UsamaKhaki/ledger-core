"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Debt, DebtInput, Payment } from "@/lib/types";

/**
 * Planner data (debts + payments) sourced from the API. Today the API is backed
 * by in-memory fixtures; later it's Supabase — this hook doesn't change.
 */
export function useDebtsData() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, p] = await Promise.all([
          api.debts.list(),
          api.payments.list(),
        ]);
        if (cancelled) return;
        if (d.status === 200) setDebts(d.body.debts);
        if (p.status === 200) setPayments(p.body.payments);
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
    if (res.status === 200) setDebts((cur) => [...cur, res.body.debt]);
    return { error: res.status === 200 ? null : "Could not add debt." };
  }, []);

  const saveDebt = useCallback(
    async (id: string, patch: Partial<DebtInput>) => {
      const res = await api.debts.update({ params: { id }, body: patch });
      if (res.status === 200) {
        const updated = res.body.debt;
        setDebts((cur) => cur.map((d) => (d.id === id ? updated : d)));
      }
    },
    [],
  );

  const removeDebt = useCallback(async (id: string) => {
    await api.debts.remove({ params: { id } });
    setDebts((cur) => cur.filter((d) => d.id !== id));
    setPayments((cur) => cur.filter((p) => p.debtId !== id));
  }, []);

  const clearAll = useCallback(async () => {
    await api.debts.clear();
    setDebts([]);
    setPayments([]);
  }, []);

  const logPayment = useCallback(async (debtId: string, amount: number) => {
    const res = await api.payments.log({ body: { debtId, amount } });
    if (res.status !== 200) return { ok: false as const };
    const { payment, debt, cleared } = res.body;
    setDebts((cur) => cur.map((d) => (d.id === debt.id ? debt : d)));
    setPayments((cur) => [payment, ...cur]);
    return { ok: true as const, cleared, debt };
  }, []);

  return {
    debts,
    payments,
    loading,
    addDebt,
    saveDebt,
    removeDebt,
    clearAll,
    logPayment,
  };
}
