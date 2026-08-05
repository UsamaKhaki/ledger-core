import type { Debt, DebtKind } from "./types";

export type KindMeta = {
  value: DebtKind;
  label: string;
  icon: string;
  card: boolean; // has a credit limit → shows utilization
};

export const DEBT_KINDS: KindMeta[] = [
  { value: "credit_card", label: "Credit card", icon: "💳", card: true },
  { value: "store_card", label: "Store card", icon: "🏬", card: true },
  { value: "personal_loan", label: "Personal loan", icon: "💵", card: false },
  { value: "auto_loan", label: "Car loan", icon: "🚗", card: false },
  { value: "student_loan", label: "Student loan", icon: "🎓", card: false },
  { value: "mortgage", label: "Mortgage", icon: "🏠", card: false },
  { value: "medical", label: "Medical", icon: "🏥", card: false },
  { value: "bnpl", label: "Buy now, pay later", icon: "🛍️", card: false },
  { value: "other", label: "Other", icon: "◆", card: false },
];

const FALLBACK = DEBT_KINDS[DEBT_KINDS.length - 1];

export function kindMeta(kind?: DebtKind): KindMeta {
  return DEBT_KINDS.find((k) => k.value === kind) ?? FALLBACK;
}

export function isCardKind(kind?: DebtKind): boolean {
  return kindMeta(kind).card;
}

/** Credit utilization (0–100) for cards with a limit, else null. */
export function utilization(debt: Debt): number | null {
  if (!debt.creditLimit || debt.creditLimit <= 0) return null;
  return Math.min(999, Math.round((debt.balance / debt.creditLimit) * 100));
}

/** Health color for a utilization value (<30 good, <75 warn, else high). */
export function utilizationTone(pct: number): string {
  if (pct < 30) return "var(--success)";
  if (pct < 75) return "var(--accent)";
  return "var(--danger)";
}

const ORDINAL = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Due-date info given the day-of-month and a current timestamp (pass `now` in so
 * this stays pure — no `new Date()` during render). Returns days until the next
 * occurrence and a short label.
 */
export function dueInfo(
  dueDay: number,
  now: number,
): { daysUntil: number; label: string; ordinal: string } {
  const today = new Date(now);
  const y = today.getFullYear();
  const m = today.getMonth();
  const clampDay = (year: number, month: number) =>
    Math.min(dueDay, new Date(year, month + 1, 0).getDate());
  let next = new Date(y, m, clampDay(y, m));
  if (next.getTime() < new Date(y, m, today.getDate()).getTime()) {
    next = new Date(y, m + 1, clampDay(y, m + 1));
  }
  const daysUntil = Math.round(
    (next.getTime() - new Date(y, m, today.getDate()).getTime()) / 86_400_000,
  );
  const label =
    daysUntil === 0 ? "Due today" : daysUntil === 1 ? "Due tomorrow" : `Due in ${daysUntil}d`;
  return { daysUntil, label, ordinal: ORDINAL(dueDay) };
}
