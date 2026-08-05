"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--elevate)] px-4 py-3 text-[15px] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 placeholder:text-[var(--muted)]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await requestPasswordReset(email);
    setBusy(false);
    setSent(true);
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-[var(--brand)]/12 blur-[140px]" />

      <div className="reveal glass relative w-full max-w-md rounded-2xl p-8 [box-shadow:var(--shadow)]">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)]/10 text-2xl">
              ✉️
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              If an account exists for{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {email}
              </span>
              , we&apos;ve sent a link to reset your password. It expires
              shortly, so use it soon.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Reset your password
              </h1>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3.5">
              <input
                className={field}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <button
                type="submit"
                disabled={busy}
                className="btn-white mt-1 w-full px-4 py-3.5 text-[15px] disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-[var(--muted)]">
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--brand)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
