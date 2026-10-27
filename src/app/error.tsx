"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary. `global-error.tsx` only catches failures in the
// root layout itself — without this file, an error thrown by any page would
// escape to that bare fallback and take the whole shell (nav, theme) with it.
// Here the chrome survives and only the page area is replaced.
export default function RouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col items-center px-4 py-20 text-center sm:px-6 lg:w-4/5">
      <p className="kicker">Something broke</p>
      <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        This page didn&apos;t load
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
        An unexpected error interrupted this page. Nothing you&apos;ve saved is
        affected — the error has been logged and you can try again.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono-num text-xs text-[var(--muted)]">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {/* retry re-fetches and re-renders the segment (reset only clears state) */}
        <button
          onClick={() => unstable_retry()}
          className="btn-white rounded-xl px-5 py-2.5 text-sm"
        >
          Try again
        </button>
        <Link
          href="/app"
          className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--elevate)]"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
