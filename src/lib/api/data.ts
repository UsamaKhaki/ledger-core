// Server-side data access for debts + payments. Uses Supabase (per-user, RLS)
// when configured; otherwise the in-memory fixture store. The ts-rest route
// handler calls these — nothing above this layer knows which backend is active.

import type { Debt, DebtInput, Payment } from "@/lib/types";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { store } from "./store";

// Row shapes from docs/supabase-schema.sql. PostgREST can serialise `numeric`
// as a string, so money columns go through Number() on the way out.
type Numeric = number | string;

type DebtRow = {
  id: string;
  name: string;
  kind: Debt["kind"];
  issuer: string | null;
  balance: Numeric;
  starting_balance: Numeric;
  apr: Numeric;
  min_payment: Numeric;
  credit_limit: Numeric | null;
  due_day: number | null;
};

type PaymentRow = {
  id: string;
  debt_id: string;
  amount: Numeric;
  paid_at: string;
  cleared_debt: boolean;
};

function toDebt(r: DebtRow): Debt {
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
function toPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    debtId: r.debt_id,
    amount: Number(r.amount),
    dateISO: r.paid_at,
    clearedDebt: r.cleared_debt,
  };
}

const supa = isSupabaseConfigured();

/**
 * The fixture store is a SINGLE shared dataset with no per-user scoping — every
 * visitor would see and mutate the same debts. That is fine locally, and a data
 * leak in production. Fail loudly instead of serving one user's debts to
 * another. Set ALLOW_MOCK_DATA=true to opt in deliberately (e.g. a demo build).
 */
function assertBackend(): void {
  if (supa) return;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_MOCK_DATA !== "true"
  ) {
    throw new Error(
      "No database configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY, or set ALLOW_MOCK_DATA=true to run on " +
        "the shared in-memory fixtures (never with real users).",
    );
  }
}

/** Supabase errors must surface, not read as "you have no debts". */
function raise(op: string, error: { message: string } | null): void {
  if (!error) return;
  throw new Error(`[data.${op}] ${error.message}`);
}

export const data = {
  async listDebts(): Promise<Debt[]> {
    assertBackend();
    if (!supa) return store.listDebts();
    const sb = await supabaseServer();
    const { data: rows, error } = await sb
      .from("debts")
      .select("*")
      .order("created_at", { ascending: true });
    raise("listDebts", error);
    return (rows ?? []).map(toDebt);
  },

  async createDebt(input: DebtInput): Promise<Debt | null> {
    assertBackend();
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
    assertBackend();
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
    assertBackend();
    if (!supa) return store.removeDebt(id);
    const sb = await supabaseServer();
    const { error } = await sb.from("debts").delete().eq("id", id);
    return !error;
  },

  async clear(): Promise<void> {
    assertBackend();
    if (!supa) return store.clear();
    const sb = await supabaseServer();
    const { data: auth } = await sb.auth.getUser();
    if (auth.user) await sb.from("debts").delete().eq("user_id", auth.user.id);
  },

  async listPayments(): Promise<Payment[]> {
    assertBackend();
    if (!supa) return store.listPayments();
    const sb = await supabaseServer();
    const { data: rows, error } = await sb
      .from("payments")
      .select("*")
      .order("paid_at", { ascending: false });
    raise("listPayments", error);
    return (rows ?? []).map(toPayment);
  },

  async logPayment(
    debtId: string,
    amount: number,
  ): Promise<{ payment: Payment; debt: Debt; cleared: boolean } | null> {
    assertBackend();
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
