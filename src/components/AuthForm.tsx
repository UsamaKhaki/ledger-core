"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { login, signup, resendConfirmation } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false); // signup: awaiting email confirmation
  const [resent, setResent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === "signup";

  // Surface a failed/expired confirmation link (redirected here with ?confirm=failed).
  // rAF-deferred so setState isn't synchronous in the effect body (React 19 rule).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const p = new URLSearchParams(window.location.search);
      if (p.get("confirm") === "failed") {
        setNotice(
          "That confirmation link was invalid or expired. Sign in below, or create the account again to get a fresh link.",
        );
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Where to go after auth — honor ?next= (same-origin only), else the planner.
  function destination() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (isSignup) {
      const res = await signup(email, password, name);
      setBusy(false);
      if (res.error) return setError(res.error);
      if (res.pending) return setSent(true);
      router.push(destination());
      return;
    }
    const res = await login(email, password);
    setBusy(false);
    if (res.error) return setError(res.error);
    router.push(destination());
  }

  async function resend() {
    setResent(false);
    await resendConfirmation(email);
    setResent(true);
  }

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--elevate)] px-4 py-3 text-[15px] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 placeholder:text-[var(--muted)]";

  // Signup succeeded but the email needs confirming — no session yet.
  if (sent) {
    return (
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-[var(--brand)]/12 blur-[140px]" />
        <div className="reveal glass relative w-full max-w-md rounded-2xl p-8 text-center [box-shadow:var(--shadow)]">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)]/10 text-2xl">
            ✉️
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Confirm your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {email}
            </span>
            . Click it to activate your account, then you&apos;ll be signed in.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <p className="text-[var(--muted)]">
              Didn&apos;t get it? Check spam, or resend below.
            </p>
            {resent ? (
              <p className="rounded-xl border-l-2 border-[var(--success)] bg-[var(--success)]/10 px-3 py-2 text-xs text-[var(--success)]">
                Sent again — give it a minute to arrive.
              </p>
            ) : null}
            <button
              onClick={resend}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold transition hover:border-[var(--border-strong)]"
            >
              Resend confirmation email
            </button>
            <Link
              href="/login"
              className="block text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-[var(--brand)]/12 blur-[140px]" />

      <div className="reveal glass relative w-full max-w-md rounded-2xl p-8 [box-shadow:var(--shadow)]">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center">
            <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
              <defs>
                <linearGradient id="authMark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <g transform="rotate(-18 14 14)">
                <ellipse
                  cx="14"
                  cy="14"
                  rx="12.5"
                  ry="5.6"
                  fill="none"
                  stroke="url(#authMark)"
                  strokeWidth="1.6"
                  opacity="0.85"
                />
              </g>
              <circle cx="14" cy="14" r="3.4" fill="url(#authMark)" />
            </svg>
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isSignup
              ? "Start planning your way out of debt."
              : "Sign in to your Ledger plan."}
          </p>
        </div>

        {notice ? (
          <p className="mb-4 rounded-xl border-l-2 border-[var(--brand)] bg-[var(--brand)]/10 px-3 py-2 text-xs text-[var(--foreground)]">
            {notice}
          </p>
        ) : null}

        <form onSubmit={submit} className="space-y-3.5">
          {isSignup ? (
            <input
              className={field}
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          ) : null}
          <input
            className={field}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className={field}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />

          {!isSignup ? (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--muted)] transition hover:text-[var(--brand)]"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}

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
            {busy
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>

          {isSignup ? (
            <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[var(--brand)] hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-[var(--brand)] hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          ) : null}
        </form>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {isSignup ? "Already have an account? " : "New to Ledger? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-[var(--brand)] hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </main>
  );
}
