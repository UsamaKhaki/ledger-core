"use client";

import Link from "next/link";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { CONSENT_KEY, type Consent } from "@/lib/consent";

export function CookieConsent() {
  const { value, setValue, hydrated } = useLocalStorage<Consent>(
    CONSENT_KEY,
    null,
  );

  // Only show once mounted (avoids SSR flash) and only until a choice is made.
  if (!hydrated || value !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="hero-in fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 [box-shadow:var(--shadow)] sm:left-6 sm:right-auto"
    >
      <p className="text-sm font-semibold">Cookies</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Essential cookies keep you signed in. With your OK, we&apos;ll also use
        privacy-friendly analytics to improve Ledger — never ads or tracking.
        See our{" "}
        <Link href="/privacy" className="text-[var(--brand)] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setValue("accepted")}
          className="btn-white flex-1 rounded-xl px-3 py-2 text-sm"
        >
          Accept
        </button>
        <button
          onClick={() => setValue("rejected")}
          className="flex-1 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold transition hover:bg-[var(--elevate)]"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
