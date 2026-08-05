import type { ReactNode } from "react";
import Link from "next/link";

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="reveal">
        <p className="kicker">Legal</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated {updated}</p>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-[var(--muted)]">
          {intro}
        </p>
      </header>

      <div className="mt-12 space-y-10">{children}</div>

      <div className="mt-16 flex gap-4 border-t border-[var(--border)] pt-6 text-sm">
        <Link href="/privacy" className="text-[var(--brand)] hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-[var(--brand)] hover:underline">
          Terms of Service
        </Link>
        <Link
          href="/"
          className="ml-auto text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Home
        </Link>
      </div>
    </main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--muted)] [&_a]:text-[var(--brand)] [&_a:hover]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-[var(--foreground)] [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
