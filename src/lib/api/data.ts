// Server-side data access for debts + payments. Uses Supabase (per-user, RLS)
// when configured; otherwise the in-memory fixture store. The ts-rest route
// handler calls these — nothing above this layer knows which backend is active.

import type { Debt, DebtInput, Payment } from "@/lib/types";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { store } from "./store";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toDebt(r: any): Debt {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    issuer: r.issuer ?? null,
    balance: Number(r.balance),
    startingBalance: Number(r.starting_balance),
    apr: Number(r.apr),
    minPayment: Number(r.min_payment),
    creditLimit: r.credit_limit != null ? Number(r.credit_limit) : null,
    dueDay: r.due_day ?? null,
  };
}
function toPayment(r: any): Payment {
  return {
    id: r.id,
    debtId: r.debt_id,
    amount: Number(r.amount),
    dateISO: r.paid_at,
    clearedDebt: r.cleared_debt,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const supa = isSupabaseConfigured();

export const data = {
  async listDebts(): Promise<Debt[]> {
    if (!supa) return store.listDebts();
    const sb = await supabaseServer();
    const { data: rows } = await sb
      .from("debts")
      .select("*")
      .order("created_at", { ascending: true });
    return (rows ?? []).map(toDebt);
  },

  async createDebt(input: DebtInput): Promise<Debt | null> {
    if (!supa) return store.createDebt(input);
    const sb = await supabaseServer();
    const { data: row, error } = await sb
      .from("debts")
      .insert({
        name: input.name,
        kind: input.kind,
        issuer: input.issuer ?? null,
        balance: input.balance,
        starting_balance: input.balance,
        apr: input.apr,
        min_payment: input.minPayment,
        credit_limit: input.creditLimit ?? null,
        due_day: input.dueDay ?? null,
      })
      .select("*")
      .single();
    if (error || !row) return null;
    return toDebt(row);
  },

  async updateDebt(id: string, patch: Partial<DebtInput>): Promise<Debt | null> {
    if (!supa) return store.updateDebt(id, patch);
    const sb = await supabaseServer();

    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.kind !== undefined) update.kind = patch.kind;
    if (patch.issuer !== undefined) update.issuer = patch.issuer;
    if (patch.apr !== undefined) update.apr = patch.apr;
    if (patch.minPayment !== undefined) update.min_payment = patch.minPayment;
    if (patch.creditLimit !== undefined) update.credit_limit = patch.creditLimit;
    if (patch.dueDay !== undefined) update.due_day = patch.dueDay;
    if (patch.balance !== undefined) {
      update.balance = patch.balance;
      const { data: cur } = await sb
        .from("debts")
        .select("starting_balance")
        .eq("id", id)
        .single();
      update.starting_balance = Math.max(
        Number(cur?.starting_balance ?? patch.balance),
        patch.balance,
      );
    }

    const { data: row, error } = await sb
      .from("debts")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !row) return null;
    return toDebt(row);
  },

  async removeDebt(id: string): Promise<boolean> {
    if (!supa) return store.removeDebt(id);
    const sb = await supabaseServer();
    const { error } = await sb.from("debts").delete().eq("id", id);
    return !error;
  },

  async clear(): Promise<void> {
    if (!supa) return store.clear();
    const sb = await supabaseServer();
    const { data: auth } = await sb.auth.getUser();
    if (auth.user) await sb.from("debts").delete().eq("user_id", auth.user.id);
  },

  async listPayments(): Promise<Payment[]> {
    if (!supa) return store.listPayments();
    const sb = await supabaseServer();
    const { data: rows } = await sb
      .from("payments")
      .select("*")
      .order("paid_at", { ascending: false });
    return (rows ?? []).map(toPayment);
  },

  async logPayment(
    debtId: string,
    amount: number,
  ): Promise<{ payment: Payment; debt: Debt; cleared: boolean } | null> {
    if (!supa) return store.logPayment(debtId, amount);
    const sb = await supabaseServer();

    const { data: cur } = await sb
      .from("debts")
      .select("*")
      .eq("id", debtId)
      .single();
    if (!cur) return null;

    const newBalance = Math.max(0, Number(cur.balance) - amount);
    const cleared = Number(cur.balance) > 0.005 && newBalance <= 0.005;

    const { data: updated } = await sb
      .from("debts")
      .update({ balance: newBalance })
      .eq("id", debtId)
      .select("*")
      .single();

    const { data: payment } = await sb
      .from("payments")
      .insert({
        debt_id: debtId,
        amount,
        cleared_debt: cleared,
      })
      .select("*")
      .single();

    if (!updated || !payment) return null;
    return { payment: toPayment(payment), debt: toDebt(updated), cleared };
  },
};
