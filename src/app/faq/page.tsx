import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "FAQ",
  description:
    "Answers to common questions about Ledger — pricing, privacy, how your data is stored, strategies, and cancelling Pro.",
};

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="reveal text-center">
        <p className="kicker">FAQ</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
          Everything you might want to know before you start. Still stuck? We&apos;re
          an email away.
        </p>
      </header>

      <div className="mt-12">
        <Faq />
      </div>

      <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--elevate)] p-6 text-center sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Still have a question?
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Reach us at{" "}
          <a
            href="mailto:support@ledger.app"
            className="font-semibold text-[var(--brand)] hover:underline"
          >
            support@ledger.app
          </a>
          .
        </p>
        <Link
          href="/signup"
          className="btn-white mt-5 inline-block rounded-xl px-5 py-3 text-sm"
        >
          Start free
        </Link>
      </section>
    </main>
  );
}
