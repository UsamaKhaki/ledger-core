import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "See how Ledger turns your debts into one clear payoff plan — add your balances, pick a strategy, get your debt-free date, and track every payment.",
};

const STEPS = [
  {
    n: "01",
    t: "Add your debts",
    d: "Enter each card or loan — balance, interest rate, and minimum payment. Import a whole CSV in one go, or add them one at a time. Credit cards show utilization; loans show payoff progress.",
  },
  {
    n: "02",
    t: "Pick a strategy",
    d: "Choose Avalanche to pay the least interest, or Snowball for quick, motivating wins. Ledger shows both side by side so you can decide with your eyes open.",
  },
  {
    n: "03",
    t: "See your debt-free date",
    d: "Instantly get the exact month you'll be debt-free, the total interest ahead, and a month-by-month payoff chart. Nudge the extra-payment slider to watch the date jump closer.",
  },
  {
    n: "04",
    t: "Track every payment",
    d: "Log payments as you go. Balances update, progress climbs, and freed-up minimums roll into your next target automatically. Milestones get a little celebration.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="reveal">
        <p className="kicker">How it works</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          From scattered debts to one clear plan
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          No bank linking, no spreadsheets. Four steps to a plan you&apos;ll
          actually stick to.
        </p>
      </header>

      <ol className="mt-14 space-y-10">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-5 sm:gap-8">
            <span className="font-mono-num shrink-0 text-2xl font-bold text-[var(--brand)] sm:text-3xl">
              {s.n}
            </span>
            <div className="border-b border-[var(--border)] pb-10">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {s.t}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {s.d}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--elevate)] p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Not sure which strategy?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Avalanche saves the most money; Snowball keeps you motivated. Here&apos;s
          how to choose.
        </p>
        <Link
          href="/avalanche-vs-snowball"
          className="mt-4 inline-block text-sm font-semibold text-[var(--brand)] hover:underline"
        >
          Avalanche vs. Snowball →
        </Link>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Link href="/signup" className="btn-white rounded-xl px-5 py-3 text-sm">
          Start free
        </Link>
        <Link
          href="/faq"
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          Read the FAQ
        </Link>
      </div>
    </main>
  );
}
