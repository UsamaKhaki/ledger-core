"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { CURRENCIES, useMoney } from "@/lib/CurrencyContext";
import { useSubscription } from "@/lib/subscription";
import { useAuth } from "@/lib/auth/useAuth";
import { useTheme } from "@/lib/theme";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { CONSENT_KEY, type Consent } from "@/lib/consent";
import { ChangePassword } from "@/components/ChangePassword";
import { EmailNotifications } from "@/components/EmailNotifications";
import {
  DEFAULT_REMINDERS,
  LEAD_OPTIONS,
  type ReminderPrefs,
} from "@/lib/reminders";

/** One settings row: label + description on the left, control on the right. */
function Row({
  label,
  description,
  aside,
  children,
  danger = false,
}: {
  label: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <section className="grid gap-4 py-8 md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <h2
          className={`kicker ${danger ? "!text-[var(--danger)]" : ""}`}
        >
          {label}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {description}
        </p>
        {aside ? <div className="mt-2">{aside}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const panel =
  "rounded-2xl border border-[var(--border)] bg-[var(--elevate)] p-4 sm:p-5";

export default function SettingsPage() {
  const { settings, setCurrency, format } = useMoney();
  const { isPro, billing, manage, configured } = useSubscription();
  const { user, loading, logout, exportData, deleteAccount } = useAuth();
  const { mode, setMode } = useTheme();
  const { value: reminders, setValue: setReminders } =
    useLocalStorage<ReminderPrefs>("debtplanner.reminders", DEFAULT_REMINDERS);
  const { value: consent, setValue: setConsent } = useLocalStorage<Consent>(
    CONSENT_KEY,
    null,
  );
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleReminders() {
    if (reminders.enabled) {
      setReminders({ ...reminders, enabled: false });
      return;
    }
    if (typeof Notification === "undefined") return;
    const perm =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    if (perm === "granted") setReminders({ ...reminders, enabled: true });
  }

  function clearLocalPrefs() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("debtplanner."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  async function exportMyData() {
    setExporting(true);
    try {
      const bundle = await exportData();
      if (!bundle) {
        alert("Please sign in to export your data.");
        return;
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ledger-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function deleteMyAccount() {
    if (
      !confirm(
        "Permanently delete your account? This erases your profile, all debts, and payment history from our servers. This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        alert(error);
        return;
      }
      clearLocalPrefs();
      location.href = "/";
    } finally {
      setDeleting(false);
    }
  }

  return (
    /* Standard page container (CLAUDE.md: one container for every route);
       the settings rows are narrowed inside it, not by shrinking the page. */
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:w-4/5">
      <div className="mx-auto w-full max-w-4xl">
      <header className="reveal">
        <p className="kicker">Preferences</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Settings
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
          Manage your account, plan, and how Ledger looks.
        </p>
      </header>

      <div className="mt-8 divide-y divide-[var(--border)] border-t border-[var(--border)]">
        {/* Account */}
        <Row label="Account" description="Your profile and current session.">
          <div className={`${panel} flex items-center justify-between gap-4`}>
            {loading ? (
              <p className="text-sm text-[var(--muted)]">Loading…</p>
            ) : user ? (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#818cf8] to-[#34d399] text-base font-bold text-[#06070d]">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    {user.name ? (
                      <p className="truncate font-display text-base font-semibold">
                        {user.name}
                      </p>
                    ) : null}
                    <p className="truncate text-sm text-[var(--muted)]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--muted)]">
                  You&apos;re not signed in.
                </p>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--border-strong)]"
                  >
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-white rounded-xl px-4 py-2 text-sm">
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </div>
        </Row>

        {/* Security */}
        {user ? (
          <Row
            label="Security"
            description="Change the password for your account."
          >
            <div className={panel}>
              <ChangePassword />
            </div>
          </Row>
        ) : null}

        {/* Plan */}
        <Row
          label="Plan & billing"
          description="Your subscription and what's unlocked."
        >
          <div className={`${panel} flex items-center justify-between gap-4`}>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold">
                {isPro ? "Ledger Pro" : "Free plan"}
                {isPro && billing ? (
                  <span className="ml-2 text-sm font-normal text-[var(--muted)]">
                    · {billing}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {isPro
                  ? "Unlimited debts, full schedule, and CSV export."
                  : "Up to 3 debts. Upgrade for unlimited and more."}
              </p>
            </div>
            {isPro ? (
              <button
                onClick={() => {
                  // Configured: open Stripe's portal (handles cancel/updates).
                  // Dev simulation: confirm, then flip the local flag.
                  if (configured) {
                    void manage();
                    return;
                  }
                  if (confirm("Cancel Pro and return to the free plan?"))
                    void manage();
                }}
                className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--elevate)]"
              >
                {configured ? "Manage billing" : "Manage"}
              </button>
            ) : (
              <Link
                href="/pricing"
                className="btn-white shrink-0 rounded-xl px-4 py-2 text-sm"
              >
                Upgrade
              </Link>
            )}
          </div>
        </Row>

        {/* Appearance */}
        <Row label="Appearance" description="Light or dark theme.">
          <div className="inline-flex rounded-xl border border-[var(--border)] p-1">
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition ${
                  mode === m
                    ? "bg-[var(--brand)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Row>

        {/* Currency */}
        <Row
          label="Currency"
          description="How amounts are displayed across the app."
          aside={
            <span className="text-xs text-[var(--muted)]">
              Preview:{" "}
              <span className="font-mono-num text-[var(--foreground)]">
                {format(1234)}
              </span>
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CURRENCIES.map((c) => {
              const active = settings.currency === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? "border-[var(--brand)] bg-[var(--brand)]/10"
                      : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--elevate)]"
                  }`}
                >
                  <span className="w-6 shrink-0 text-center text-base font-semibold">
                    {c.symbol}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{c.code}</span>
                    <span className="block truncate text-[11px] text-[var(--muted)]">
                      {c.name}
                    </span>
                  </span>
                  {active ? (
                    <span className="text-[var(--brand)]">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Row>

        {/* Email notifications (server-backed) — a Pro feature, enforced in the
            reminders cron. Show the upgrade path instead of controls that
            wouldn't send anything. */}
        {user ? (
          <Row
            label="Email notifications"
            description="Reminders and progress updates sent to your inbox."
            aside={
              !isPro && configured ? (
                <span className="chip !text-[var(--brand)]">Pro</span>
              ) : null
            }
          >
            <div className={panel}>
              {isPro || !configured ? (
                <EmailNotifications />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    Get a nudge before each due date and a weekly progress
                    recap, emailed to you.
                  </p>
                  <Link
                    href="/pricing"
                    className="btn-white shrink-0 rounded-xl px-4 py-2 text-sm"
                  >
                    Upgrade
                  </Link>
                </div>
              )}
            </div>
          </Row>
        ) : null}

        {/* Browser reminders */}
        <Row
          label="Browser reminders"
          description="Get a nudge before a payment is due."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Browser reminders</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  Notifications for due dates while Ledger is open. Email
                  reminders are coming soon.
                </p>
              </div>
              <button
                onClick={toggleReminders}
                role="switch"
                aria-checked={reminders.enabled}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  reminders.enabled ? "bg-[var(--brand)]" : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    reminders.enabled ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            <div
              className={`flex items-center gap-3 ${
                reminders.enabled ? "" : "pointer-events-none opacity-40"
              }`}
            >
              <span className="text-sm text-[var(--muted)]">Remind me</span>
              <div className="flex gap-1.5">
                {LEAD_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setReminders({ ...reminders, leadDays: d })}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      reminders.leadDays === d
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    {d}d before
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Row>

        {/* Privacy */}
        <Row
          label="Data & privacy"
          description="Where your information lives and your rights over it."
          aside={
            <div className="flex gap-3 text-xs">
              <Link href="/privacy" className="text-[var(--brand)] hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-[var(--brand)] hover:underline">
                Terms
              </Link>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="max-w-prose text-sm leading-relaxed text-[var(--muted)]">
              Your preferences live in this browser. Your account, debts, and
              payments are stored securely and isolated per user — never sold or
              shared with third parties. Payments are handled by Stripe; we never
              see your card details.
            </p>
            <div>
              <button
                onClick={exportMyData}
                disabled={exporting || !user}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--border-strong)] disabled:opacity-50"
              >
                {exporting ? "Preparing…" : "Export my data (JSON)"}
              </button>
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                Download everything we hold about you.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Cookies</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {consent === "accepted"
                    ? "Analytics enabled."
                    : consent === "rejected"
                      ? "Essential cookies only."
                      : "No choice made yet."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConsent("accepted")}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    consent === "accepted"
                      ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  Accept analytics
                </button>
                <button
                  onClick={() => setConsent("rejected")}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    consent === "rejected"
                      ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]"
                      : "border-[var(--border)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  Essential only
                </button>
              </div>
            </div>
          </div>
        </Row>

        {/* Danger */}
        <Row
          label="Danger zone"
          description="Irreversible, destructive actions."
          danger
        >
          <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.05] p-4 sm:p-5">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              {user
                ? "Permanently delete your account and everything tied to it — profile, debts, and payment history — from our servers. Any active subscription is cancelled. This can't be undone."
                : "Clear all locally stored preferences and data from this browser. This can't be undone."}
            </p>
            <button
              onClick={
                user
                  ? deleteMyAccount
                  : () => {
                      if (
                        confirm(
                          "Clear all locally stored data from this browser?",
                        )
                      ) {
                        clearLocalPrefs();
                        location.href = "/";
                      }
                    }
              }
              disabled={deleting}
              className="mt-3 rounded-xl border border-[var(--danger)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white disabled:opacity-60"
            >
              {deleting
                ? "Deleting…"
                : user
                  ? "Delete my account"
                  : "Clear local data"}
            </button>
          </div>
        </Row>
      </div>

      <Link
        href="/app"
        className="mt-8 inline-block text-sm font-medium text-[var(--brand)] hover:underline"
      >
        ← Back to planner
      </Link>
      </div>
    </main>
  );
}
