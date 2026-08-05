"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { useMoney } from "@/lib/CurrencyContext";
import { LEAD_OPTIONS } from "@/lib/reminders";
import type { NotificationPrefs } from "@/lib/types";

function Switch({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-[var(--brand)]" : "bg-[var(--border)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          on ? "left-[1.375rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function EmailNotifications() {
  const { settings } = useMoney();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.notifications.get();
      if (!cancelled && res.status === 200) setPrefs(res.body);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(patch: Partial<NotificationPrefs>) {
    if (!prefs) return;
    setPrefs({ ...prefs, ...patch }); // optimistic
    // Always sync currency so emailed amounts use the right format.
    const res = await api.notifications.update({
      body: { ...patch, currency: settings.currency },
    });
    if (res.status === 200) setPrefs(res.body);
  }

  if (!prefs) {
    return <div className="text-sm text-[var(--muted)]">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      {/* due-date reminders */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Payment reminders</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            An email before a payment is due, so nothing slips.
          </p>
        </div>
        <Switch
          on={prefs.emailReminders}
          onToggle={() => save({ emailReminders: !prefs.emailReminders })}
          label="Toggle payment reminders"
        />
      </div>

      <div
        className={`flex items-center gap-3 ${
          prefs.emailReminders ? "" : "pointer-events-none opacity-40"
        }`}
      >
        <span className="text-sm text-[var(--muted)]">Remind me</span>
        <div className="flex gap-1.5">
          {LEAD_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => save({ leadDays: d })}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                prefs.leadDays === d
                  ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]"
              }`}
            >
              {d}d before
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      {/* weekly summary */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Weekly progress</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            A short Monday recap of how much you&apos;ve paid off.
          </p>
        </div>
        <Switch
          on={prefs.weeklySummary}
          onToggle={() => save({ weeklySummary: !prefs.weeklySummary })}
          label="Toggle weekly progress email"
        />
      </div>
    </div>
  );
}
