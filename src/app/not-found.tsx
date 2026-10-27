import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

// Custom 404. Without this file Next serves its own bare page, which renders
// outside the app's styling and loses the nav entirely.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col items-center px-4 py-20 text-center sm:px-6 lg:w-4/5">
      <p className="kicker">404</p>
      <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        We can&apos;t find that page
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
        The link may be out of date, or the page may have moved. Your plan and
        your data are exactly where you left them.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/app" className="btn-white rounded-xl px-5 py-2.5 text-sm">
          Go to my plan
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold transition hover:bg-[var(--elevate)]"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
