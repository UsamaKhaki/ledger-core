import type { Debt } from "./types";
import { dueInfo } from "./cards";

export type ReminderPrefs = {
  enabled: boolean; // browser notifications on
  leadDays: number; // notify this many days before a due date
};

export const DEFAULT_REMINDERS: ReminderPrefs = { enabled: false, leadDays: 3 };
export const LEAD_OPTIONS = [1, 3, 7] as const;

export type DueItem = {
  debt: Debt;
  daysUntil: number;
  label: string;
  ordinal: string;
};

/** Active debts with a due date, soonest first. */
export function upcoming(debts: Debt[], now: number): DueItem[] {
  return debts
    .filter((d) => d.balance > 0.005 && d.dueDay != null)
    .map((d) => {
      const info = dueInfo(d.dueDay as number, now);
      return { debt: d, ...info };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

const REMINDED_KEY = "debtplanner.reminded";

/**
 * Fire a browser notification for each debt due within `leadDays`, at most once
 * per calendar day per debt (deduped in localStorage). Side-effect only —
 * safe to call from an effect. No-op without permission.
 */
export function notifyDueSoon(debts: Debt[], now: number, leadDays: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const todayKey = new Date(now).toISOString().slice(0, 10);
  let log: Record<string, string> = {};
  try {
    log = JSON.parse(localStorage.getItem(REMINDED_KEY) || "{}");
  } catch {
    log = {};
  }

  for (const item of upcoming(debts, now)) {
    if (item.daysUntil > leadDays) break; // sorted ascending
    if (log[item.debt.id] === todayKey) continue;
    const when =
      item.daysUntil === 0
        ? "today"
        : item.daysUntil === 1
          ? "tomorrow"
          : `in ${item.daysUntil} days`;
    new Notification("Payment due soon", {
      body: `${item.debt.name} is due ${when}.`,
    });
    log[item.debt.id] = todayKey;
  }

  try {
    localStorage.setItem(REMINDED_KEY, JSON.stringify(log));
  } catch {
    // ignore
  }
}
