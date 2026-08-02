import type {
  Debt,
  Strategy,
  MonthRow,
  PlanResult,
  DebtPayoffResult,
} from "./types";

const MAX_MONTHS = 1200; // safety cap: 100 years

export function totalMinimums(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + Math.max(0, d.minPayment), 0);
}

export function totalBalance(debts: Debt[]): number {
  return debts.reduce((sum, d) => sum + Math.max(0, d.balance), 0);
}

/** Order debt ids by the chosen strategy's priority (target first). */
function priorityOrder(debts: Debt[], strategy: Strategy): string[] {
  const copy = [...debts];
  copy.sort((a, b) => {
    if (strategy === "avalanche") {
      // highest APR first; tie-break by smaller balance
      if (b.apr !== a.apr) return b.apr - a.apr;
      return a.balance - b.balance;
    }
    // snowball: smallest balance first; tie-break by higher APR
    if (a.balance !== b.balance) return a.balance - b.balance;
    return b.apr - a.apr;
  });
  return copy.map((d) => d.id);
}

function monthLabel(startYear: number, startMonth0: number, offset: number): string {
  const d = new Date(startYear, startMonth0 + offset, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Simulate paying down all debts using the debt-snowball/avalanche method.
 * `monthlyBudget` is the total the user pays across ALL debts each month.
 * Freed-up minimums are rolled into the target debt automatically.
 */
export function buildPlan(
  debts: Debt[],
  monthlyBudget: number,
  strategy: Strategy,
  start: Date = new Date(),
): PlanResult {
  const active = debts.filter((d) => d.balance > 0);
  const totalPrincipal = totalBalance(active);
  const startYear = start.getFullYear();
  const startMonth0 = start.getMonth();

  const minSum = totalMinimums(active);

  const empty: PlanResult = {
    feasible: true,
    minRequired: minSum,
    months: 0,
    debtFreeLabel: monthLabel(startYear, startMonth0, 0),
    totalInterest: 0,
    totalPaid: 0,
    totalPrincipal,
    schedule: [],
    perDebt: [],
  };

  if (active.length === 0) return empty;

  if (monthlyBudget < minSum) {
    return {
      ...empty,
      feasible: false,
      reason:
        "Your monthly budget doesn't cover the minimum payments on all your debts. Increase it to at least the amount below.",
    };
  }

  // Working balances keyed by id
  const balances: Record<string, number> = {};
  const interestByDebt: Record<string, number> = {};
  const nameById: Record<string, string> = {};
  for (const d of active) {
    balances[d.id] = d.balance;
    interestByDebt[d.id] = 0;
    nameById[d.id] = d.name;
  }
  const minById: Record<string, number> = {};
  for (const d of active) minById[d.id] = Math.max(0, d.minPayment);

  const order = priorityOrder(active, strategy);
  const perDebt: DebtPayoffResult[] = [];
  const schedule: MonthRow[] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  const isCleared = (id: string) => balances[id] <= 0.005;

  let month = 0;
  while (Object.keys(balances).some((id) => !isCleared(id)) && month < MAX_MONTHS) {
    month += 1;
    let monthInterest = 0;
    let monthPaid = 0;

    // 1) Accrue interest on active debts
    for (const id of Object.keys(balances)) {
      if (isCleared(id)) continue;
      const debt = active.find((d) => d.id === id)!;
      const interest = balances[id] * (debt.apr / 100 / 12);
      balances[id] += interest;
      interestByDebt[id] += interest;
      monthInterest += interest;
    }
    totalInterest += monthInterest;

    // 2) Pay minimums first
    let available = monthlyBudget;
    const paymentThisMonth: Record<string, number> = {};
    for (const id of Object.keys(balances)) {
      if (isCleared(id)) continue;
      const pay = Math.min(minById[id], balances[id], available);
      paymentThisMonth[id] = pay;
      available -= pay;
    }

    // 3) Pour remaining budget into debts in priority order
    for (const id of order) {
      if (available <= 0.005) break;
      if (isCleared(id)) continue;
      const remaining = balances[id] - (paymentThisMonth[id] ?? 0);
      if (remaining <= 0) continue;
      const extra = Math.min(remaining, available);
      paymentThisMonth[id] = (paymentThisMonth[id] ?? 0) + extra;
      available -= extra;
    }

    // 4) Apply payments
    for (const id of Object.keys(paymentThisMonth)) {
      const pay = paymentThisMonth[id];
      balances[id] -= pay;
      monthPaid += pay;
      if (balances[id] < 0) balances[id] = 0;
      // record payoff month
      if (isCleared(id) && !perDebt.some((p) => p.debtId === id)) {
        perDebt.push({
          debtId: id,
          name: nameById[id],
          monthsToPayoff: month,
          payoffLabel: monthLabel(startYear, startMonth0, month),
          interestPaid: interestByDebt[id],
        });
      }
    }
    totalPaid += monthPaid;

    const snapshot: Record<string, number> = {};
    let remainingTotal = 0;
    for (const id of Object.keys(balances)) {
      snapshot[id] = balances[id];
      remainingTotal += balances[id];
    }

    schedule.push({
      month,
      label: monthLabel(startYear, startMonth0, month),
      totalBalance: remainingTotal,
      totalInterest: monthInterest,
      totalPaid: monthPaid,
      balances: snapshot,
    });
  }

  const feasible = month < MAX_MONTHS;

  return {
    feasible,
    minRequired: minSum,
    reason: feasible
      ? undefined
      : "With this budget the interest outpaces payments and the debt never fully clears. Try increasing your monthly budget.",
    months: month,
    debtFreeLabel: monthLabel(startYear, startMonth0, month),
    totalInterest,
    totalPaid,
    totalPrincipal,
    schedule,
    perDebt,
  };
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatCurrencyCents(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Human duration, e.g. "2 yr 4 mo" */
export function formatDuration(months: number): string {
  if (months <= 0) return "0 mo";
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} yr`);
  if (m > 0) parts.push(`${m} mo`);
  return parts.join(" ");
}
