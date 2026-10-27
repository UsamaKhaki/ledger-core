// In-memory data store for the prototype, seeded from fixtures. Mutations persist
// for the life of the server process (reset on restart) — same shape a Supabase
// data layer will have, so swapping is mechanical.
//
// NOTE: not per-user scoped yet (single shared dataset). Supabase will scope by
// the authenticated user id.

import { randomBytes } from "node:crypto";
import type { Debt, DebtInput, Payment } from "@/lib/types";
import { FIXTURE_DEBTS, FIXTURE_PAYMENTS } from "./fixtures";

// Same reason as the mock auth provider: module-level state is duplicated
// across Next's separate server bundles, so a debt written through the API
// route wouldn't be visible to a Server Component. Keep one copy on the global.
type StoreState = { debts: Debt[]; payments: Payment[] };
const globalStore = globalThis as typeof globalThis & {
  __ledgerMockStore?: StoreState;
};
const state: StoreState = (globalStore.__ledgerMockStore ??= {
  debts: FIXTURE_DEBTS.map((d) => ({ ...d })),
  payments: FIXTURE_PAYMENTS.map((p) => ({ ...p })),
});

const id = (prefix: string) => `${prefix}_${randomBytes(6).toString("hex")}`;

export const store = {
  listDebts(): Debt[] {
    return state.debts.map((d) => ({ ...d }));
  },

  createDebt(input: DebtInput): Debt {
    const debt: Debt = {
      id: id("dbt"),
      name: input.name,
      kind: input.kind,
      issuer: input.issuer ?? null,
      balance: input.balance,
      startingBalance: input.balance,
      apr: input.apr,
      minPayment: input.minPayment,
      creditLimit: input.creditLimit ?? null,
      dueDay: input.dueDay ?? null,
    };
    state.debts.push(debt);
    return { ...debt };
  },

  updateDebt(debtId: string, patch: Partial<DebtInput>): Debt | null {
    const d = state.debts.find((x) => x.id === debtId);
    if (!d) return null;
    if (patch.name !== undefined) d.name = patch.name;
    if (patch.kind !== undefined) d.kind = patch.kind;
    if (patch.issuer !== undefined) d.issuer = patch.issuer;
    if (patch.apr !== undefined) d.apr = patch.apr;
    if (patch.minPayment !== undefined) d.minPayment = patch.minPayment;
    if (patch.creditLimit !== undefined) d.creditLimit = patch.creditLimit;
    if (patch.dueDay !== undefined) d.dueDay = patch.dueDay;
    if (patch.balance !== undefined) {
      d.balance = patch.balance;
      // keep progress sane if corrected upward past the original
      d.startingBalance = Math.max(d.startingBalance, patch.balance);
    }
    return { ...d };
  },

  removeDebt(debtId: string): boolean {
    const before = state.debts.length;
    state.debts = state.debts.filter((d) => d.id !== debtId);
    state.payments = state.payments.filter((p) => p.debtId !== debtId);
    return state.debts.length < before;
  },

  clear(): void {
    state.debts = [];
    state.payments = [];
  },

  listPayments(): Payment[] {
    return state.payments.map((p) => ({ ...p }));
  },

  logPayment(
    debtId: string,
    amount: number,
  ): { payment: Payment; debt: Debt; cleared: boolean } | null {
    const d = state.debts.find((x) => x.id === debtId);
    if (!d) return null;
    const newBalance = Math.max(0, d.balance - amount);
    const cleared = d.balance > 0.005 && newBalance <= 0.005;
    d.balance = newBalance;
    const payment: Payment = {
      id: id("pay"),
      debtId,
      amount,
      dateISO: new Date().toISOString(),
      clearedDebt: cleared,
    };
    state.payments.unshift(payment);
    return { payment: { ...payment }, debt: { ...d }, cleared };
  },
};
