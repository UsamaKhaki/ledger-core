"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";

export function ChangePassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--elevate)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 placeholder:text-[var(--muted)]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
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
    setPassword("");
    setConfirm("");
    setSaved(true);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={field}
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          className={field}
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error ? (
        <p className="rounded-xl border-l-2 border-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border-l-2 border-[var(--success)] bg-[var(--success)]/10 px-3 py-2 text-xs text-[var(--success)]">
          Password updated.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy || !password}
        className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--border-strong)] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
