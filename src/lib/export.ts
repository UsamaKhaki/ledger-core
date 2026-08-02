import type { Debt, PlanResult, Strategy } from "./types";

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV of the month-by-month payoff schedule. */
export function planToCsv(
  plan: PlanResult,
  debts: Debt[],
  strategy: Strategy,
): string {
  const active = debts.filter((d) => d.balance > 0);
  const header = [
    "Month",
    "Date",
    "Payment",
    "Interest",
    "Total balance",
    ...active.map((d) => d.name),
  ];

  const rows = plan.schedule.map((row) => [
    row.month,
    row.label,
    row.totalPaid.toFixed(2),
    row.totalInterest.toFixed(2),
    row.totalBalance.toFixed(2),
    ...active.map((d) => (row.balances[d.id] ?? 0).toFixed(2)),
  ]);

  const meta = [
    ["Debt payoff plan", ""],
    ["Strategy", strategy],
    ["Debt-free by", plan.debtFreeLabel],
    ["Months to payoff", plan.months],
    ["Total interest", plan.totalInterest.toFixed(2)],
    ["Total paid", plan.totalPaid.toFixed(2)],
    ["", ""],
  ];

  return [...meta, header, ...rows]
    .map((r) => r.map(csvEscape).join(","))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
