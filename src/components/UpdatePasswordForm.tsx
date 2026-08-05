"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export function UpdatePasswordForm() {
  const router = useRouter();
  const { user, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--elevate)] px-4 py-3 text-[15px] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 placeholder:text-[var(--muted)]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/app"), 1200);
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-[var(--brand)]/12 blur-[140px]" />

      <div className="reveal glass relative w-full max-w-md rounded-2xl p-8 [box-shadow:var(--shadow)]">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose a strong password you don&apos;t use anywhere else.
          </p>
        </div>

        {done ? (
          <p className="rounded-xl border-l-2 border-[var(--success)] bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">
            Password updated — taking you to your planner…
          </p>
        ) : loading ? (
          <p className="text-center text-sm text-[var(--muted)]">Loading…</p>
        ) : !user ? (
          <div className="text-center text-sm text-[var(--muted)]">
            <p>
              This reset link is invalid or expired. Request a new one to
              continue.
            </p>
            <Link
              href="/forgot-password"
              className="mt-4 inline-block font-semibold text-[var(--brand)] hover:underline"
            >
              Send a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5">
            <input
              className={field}
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <input
              className={field}
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error ? (
              <p className="rounded-xl border-l-2 border-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="btn-white mt-1 w-full px-4 py-3.5 text-[15px] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
