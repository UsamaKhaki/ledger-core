import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Avalanche vs. Snowball",
  description:
    "Debt avalanche vs. debt snowball, explained simply. See how each method works, which saves more interest, which keeps you motivated, and how to choose.",
};

const ROWS: [string, string, string][] = [
  ["Pays off first", "Highest interest rate", "Smallest balance"],
  ["Best for", "Saving the most money", "Staying motivated"],
  ["Total interest paid", "Lowest possible", "Slightly higher"],
  ["First win arrives", "Later", "Sooner"],
  ["Good if…", "You're rate-driven and patient", "You need momentum"],
];

function Cell({ children, accent }: { children: string; accent?: boolean }) {
  return (
    <td
      className={`px-4 py-3 text-sm ${
        accent ? "font-medium text-[var(--foreground)]" : "text-[var(--muted)]"
      }`}
    >
      {children}
    </td>
  );
}

export default function AvalancheVsSnowballPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="reveal">
        <p className="kicker">The two methods</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Avalanche vs. Snowball
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Both funnel every spare dirham at one debt at a time while paying
          minimums on the rest. They differ on <em>which</em> debt goes first —
          and that choice is really about money vs. momentum.
        </p>
      </header>

      {/* two methods */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] p-6">
          <span className="text-2xl">❄️</span>
          <h2 className="font-display mt-3 text-xl font-semibold tracking-tight">
            Debt Avalanche
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Attack the debt with the <strong className="text-[var(--foreground)]">highest interest rate</strong> first,
            then roll its payment onto the next-highest. Mathematically optimal —
            it clears your most expensive debt fastest, so you pay the least
            interest overall.
          </p>
        </section>
        <section className="rounded-2xl border border-[var(--border)] p-6">
          <span className="text-2xl">⛄</span>
          <h2 className="font-display mt-3 text-xl font-semibold tracking-tight">
            Debt Snowball
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Attack the <strong className="text-[var(--foreground)]">smallest balance</strong> first, regardless of rate.
            You clear whole debts quickly, and each payoff is a visible win that
            keeps you going. You may pay a little more interest — but many people
            stick with it longer.
          </p>
        </section>
      </div>

      {/* comparison table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] text-left">
              <th className="px-4 py-3 text-xs font-medium text-[var(--muted)]"> </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--foreground)]">
                ❄️ Avalanche
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--foreground)]">
                ⛄ Snowball
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, av, sn]) => (
              <tr key={label} className="border-b border-[var(--border)]/60 last:border-0">
                <Cell accent>{label}</Cell>
                <Cell>{av}</Cell>
                <Cell>{sn}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* worked example */}
      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--elevate)] p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          A quick example
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Say you have a small store card at 36% and a large personal loan at 9%.
          <strong className="text-[var(--foreground)]"> Avalanche</strong> hits
          the 36% card first — it&apos;s bleeding you the fastest — saving the
          most interest.{" "}
          <strong className="text-[var(--foreground)]">Snowball</strong> might
          clear a tiny AED 900 balance first for an instant win, then move on.
          Same budget, different order, different feeling.
        </p>
      </section>

      {/* how ledger helps */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          You don&apos;t have to guess
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Ledger runs both plans on your real numbers and shows them side by
          side — debt-free date, total interest, and month-by-month — so you can
          pick the one that fits how you&apos;re wired.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Link href="/signup" className="btn-white rounded-xl px-5 py-3 text-sm">
          Compare on your numbers
        </Link>
        <Link
          href="/how-it-works"
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          How Ledger works →
        </Link>
      </div>
    </main>
  );
}
