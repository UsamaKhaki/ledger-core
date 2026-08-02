export type Debt = {
  id: string;
  name: string;
  balance: number; // current amount owed
  startingBalance: number; // what was owed when the debt was first added (for progress)
  apr: number; // annual interest rate as a percent, e.g. 19.99
  minPayment: number; // required minimum monthly payment
};

export type Payment = {
  id: string;
  debtId: string;
  amount: number;
  dateISO: string; // when the payment was logged
  clearedDebt: boolean; // did this payment bring the debt to zero?
};

export type Strategy = "avalanche" | "snowball";

export type MonthRow = {
  month: number; // 1-indexed month number
  label: string; // e.g. "Aug 2026"
  totalBalance: number; // total remaining across all debts, after this month
  totalInterest: number; // interest accrued this month
  totalPaid: number; // amount paid this month
  balances: Record<string, number>; // debtId -> remaining balance after this month
};

export type DebtPayoffResult = {
  debtId: string;
  name: string;
  monthsToPayoff: number; // month number this debt hit zero
  payoffLabel: string; // e.g. "Mar 2027"
  interestPaid: number;
};

export type PlanResult = {
  feasible: boolean; // false if budget < total minimum payments (debt never clears)
  reason?: string;
  minRequired: number; // minimum monthly budget needed to cover all minimum payments
  months: number; // total months to become debt-free
  debtFreeLabel: string; // e.g. "Sep 2028"
  totalInterest: number; // total interest paid over the life of the plan
  totalPaid: number; // total money paid (principal + interest)
  totalPrincipal: number; // sum of starting balances
  schedule: MonthRow[]; // month-by-month breakdown
  perDebt: DebtPayoffResult[]; // when each individual debt is cleared
};
