// Central dummy-data fixtures. This is the ONE place sample data lives — when we
// connect Supabase, these become seed rows / are replaced by real queries.

import type { AuthUser } from "@/lib/auth/types";
import type { Debt, Payment } from "@/lib/types";

export const FIXTURE_USER: AuthUser = {
  id: "usr_demo",
  email: "demo@ledger.app",
  name: "Demo User",
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const FIXTURE_DEBTS: Debt[] = [
  { id: "dbt_visa", name: "Sapphire Visa", issuer: "Chase", kind: "credit_card", balance: 5200, startingBalance: 6000, apr: 22.9, minPayment: 130, creditLimit: 9000, dueDay: 15 },
  { id: "dbt_amex", name: "Everyday Card", issuer: "Amex", kind: "credit_card", balance: 3100, startingBalance: 3100, apr: 24.99, minPayment: 90, creditLimit: 6000, dueDay: 3 },
  { id: "dbt_car", name: "Car loan", issuer: "Toyota Financial", kind: "auto_loan", balance: 9800, startingBalance: 11000, apr: 7.5, minPayment: 260, dueDay: 20 },
  { id: "dbt_store", name: "Store card", issuer: "IKEA", kind: "store_card", balance: 1400, startingBalance: 1400, apr: 26.99, minPayment: 45, creditLimit: 2000, dueDay: 28 },
  { id: "dbt_student", name: "Student loan", issuer: "Nelnet", kind: "student_loan", balance: 12500, startingBalance: 12500, apr: 5.8, minPayment: 180, dueDay: 1 },
];

export const FIXTURE_PAYMENTS: Payment[] = [
  { id: "pay_1", debtId: "dbt_visa", amount: 400, dateISO: "2026-07-02T00:00:00.000Z", clearedDebt: false },
  { id: "pay_2", debtId: "dbt_car", amount: 600, dateISO: "2026-07-10T00:00:00.000Z", clearedDebt: false },
  { id: "pay_3", debtId: "dbt_visa", amount: 400, dateISO: "2026-08-01T00:00:00.000Z", clearedDebt: false },
];
