"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { HeroVisual } from "@/components/HeroVisual";
import {
  PRICING,
  yearlyMonthlyEquivalent,
  yearlySavingsPct,
} from "@/lib/tiers";
import { StatCounter } from "@/components/StatCounter";
import { Faq } from "@/components/Faq";
import { Reveal } from "@/components/Reveal";
import {
  BalanceGraphic,
  ProgressRing,
  StrategyBars,
} from "@/components/graphics";

const TRUST = [
  { icon: "💳", label: "Credit cards" },
  { icon: "💵", label: "Personal loans" },
  { icon: "🚗", label: "Car finance" },
  { icon: "🎓", label: "Student loans" },
  { icon: "🏬", label: "Store cards" },
  { icon: "🏥", label: "Medical debt" },
];

const STATS = [
  { value: 2, suffix: "", label: "Payoff strategies" },
  { value: 14, suffix: "", label: "Currencies supported" },
  { value: 100, suffix: "%", label: "Private, on-device" },
  { value: 3, suffix: " min", label: "To your first plan" },
];

const STEPS = [
  { n: "01", t: "List your debts", d: "Balance, rate, and minimum payment. Two minutes, no bank login." },
  { n: "02", t: "Pick a strategy", d: "Avalanche to save the most, or Snowball for quick, motivating wins." },
  { n: "03", t: "Follow the plan", d: "Log payments, watch progress fill, and reach your debt-free date." },
];

const TESTIMONIALS = [
  { quote: "Seeing an actual debt-free date instead of a vague ‘someday’ changed how I budget.", name: "Jordan M.", role: "Paid off 2 cards" },
  { quote: "The avalanche-vs-snowball comparison settled a months-long argument in ten seconds.", name: "Priya & Sam", role: "Household plan" },
  { quote: "No signup, no bank connection, no ads. I trusted it immediately.", name: "Chris T.", role: "Free plan" },
  { quote: "The extra-payment slider showed me $1,200 in interest I could avoid. Sold.", name: "Dana R.", role: "Avalanche" },
  { quote: "Watching the progress ring fill is weirdly motivating. I pay more just to move it.", name: "Marco L.", role: "3 debts cleared" },
];

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    track("view_landing");
  }, []);

  function start(e: React.FormEvent) {
    e.preventDefault();
    track("start_free", { source: "hero_email", hasEmail: email.length > 0 });
    router.push("/app");
  }

  const goApp = (source: string) => () => {
    track("start_free", { source });
    router.push("/app");
  };

  return (
    <main className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative flex min-h-[94vh] items-center overflow-hidden">
        {/* 3D orb — the debt mass, floating on the right */}
        <div className="pointer-events-none absolute inset-y-0 right-[-18%] z-0 hidden w-[70%] md:block lg:right-[-8%] lg:w-[58%]">
          <div className="absolute left-1/2 top-1/2 h-[46vw] w-[46vw] max-h-[640px] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand)]/18 blur-[130px]" />
          <HeroVisual />
        </div>
        {/* small orb echo for mobile */}
        <div className="blob left-1/2 top-24 h-72 w-72 -translate-x-1/2 bg-[var(--brand)] opacity-30 md:hidden" />

        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-20 sm:px-6 lg:w-4/5">
          <div className="max-w-2xl">
            <h1
              className="hero-in font-display text-6xl font-bold leading-[0.92] tracking-[-0.04em] sm:text-7xl lg:text-8xl"
              style={{ animationDelay: "0.06s" }}
            >
              Escape the
              <br />
              <span className="text-gradient">gravity</span> of debt.
            </h1>

            <p
              className="hero-in mt-8 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg"
              style={{ animationDelay: "0.26s" }}
            >
              Ledger turns your balances into one weightless plan — the exact
              order to pay, the day you&apos;re free, and every dollar of
              interest you&apos;ll shed along the way.
            </p>

            <form
              onSubmit={start}
              style={{ animationDelay: "0.38s" }}
              className="hero-in glass mt-9 flex max-w-md items-center gap-2 rounded-full p-1.5 transition focus-within:border-[var(--brand)]/60 focus-within:ring-2 focus-within:ring-[var(--brand)]/15"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email (optional)"
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-[var(--muted)]"
              />
              <button
                type="submit"
                className="btn-white group flex shrink-0 items-center gap-1.5 px-6 py-3 text-sm"
              >
                Start free
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </form>

            <div
              className="hero-in mt-8 flex items-center gap-6 text-xs text-[var(--muted)]"
              style={{ animationDelay: "0.5s" }}
            >
              <span className="flex items-center gap-1.5">🔒 100% private</span>
              <span className="flex items-center gap-1.5">
                ⚡ Ready in 2 minutes
              </span>
              <span className="flex items-center gap-1.5">💳 No card</span>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[var(--muted)] sm:flex">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <span className="h-8 w-px animate-pulse bg-gradient-to-b from-[var(--muted)] to-transparent" />
        </div>
      </section>

      {/* ---------- Stats band ---------- */}
      <section className="border-y border-[var(--border)]">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-y-14 px-4 py-20 sm:grid-cols-4 sm:px-6 lg:w-4/5">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-2 text-center sm:px-6 ${
                i > 0 ? "sm:border-l sm:border-[var(--border)]" : ""
              }`}
            >
              <StatCounter
                value={s.value}
                suffix={s.suffix}
                className="font-display text-gradient text-5xl font-bold tracking-[-0.03em] sm:text-6xl"
              />
              <p className="mt-3 text-[13px] tracking-wide text-[var(--muted)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Trust strip (icon pills) ---------- */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 lg:w-4/5">
        <p className="kicker text-center">Works with every kind of debt</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {TRUST.map((t) => (
            <span
              key={t.label}
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--elevate)] px-4 py-2 text-sm font-medium text-[var(--foreground)]/85 transition hover:border-[var(--border-strong)] hover:bg-[var(--elevate)]"
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Alternating graphic rows (replaces box grids) ---------- */}
      <section className="mx-auto w-full max-w-[1600px] space-y-36 px-4 py-28 sm:px-6 lg:w-4/5">
        {/* Row 1 — balance chart */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="chip">Your debt-free date</span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Watch your balance fall to{" "}
                <span className="text-gradient">zero</span>
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                Ledger projects every month ahead and shows the exact date
                you&apos;ll be free. Pay a little extra and the whole curve pulls
                in — you can literally see the finish line move closer.
              </p>
            </Reveal>
            <Reveal delay={270}>
              <button
                onClick={goApp("row_balance")}
                className="btn-white mt-6 px-6 py-3 text-sm"
              >
                See your date →
              </button>
            </Reveal>
          </div>
          <div className="rise">
            <BalanceGraphic />
          </div>
        </div>

        {/* Row 2 — progress ring (image left) */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="rise order-2 lg:order-1">
            <ProgressRing percent={68} label="of your debt paid" />
          </div>
          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="chip">Momentum</span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Real progress you can feel
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                Log each payment and watch the ring fill. Every debt you clear
                triggers a little celebration — the small wins that keep you going
                all the way to zero.
              </p>
            </Reveal>
            <Reveal delay={270}>
              <ul className="mt-5 space-y-2 text-sm">
                {["Per-debt progress bars", "Milestone confetti on payoff", "A running debt-free countdown"].map(
                  (x) => (
                    <li key={x} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[var(--success)]">✓</span>
                      {x}
                    </li>
                  ),
                )}
              </ul>
            </Reveal>
          </div>
        </div>

        {/* Row 3 — strategy bars */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="chip">Avalanche vs Snowball</span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Pick the strategy that saves you more
              </h2>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
                Compare both methods on your real numbers. See exactly how much
                interest and how many months each one costs — then choose with
                your eyes open.
              </p>
            </Reveal>
            <Reveal delay={270}>
              <button
                onClick={goApp("row_strategy")}
                className="btn-white mt-6 px-6 py-3 text-sm"
              >
                Compare on my debts →
              </button>
            </Reveal>
          </div>
          <div className="rise">
            <StrategyBars />
            <p className="mt-4 text-center text-xs text-[var(--muted)]">
              Total interest paid · lower is better
            </p>
          </div>
        </div>
      </section>

      {/* ---------- How it works (timeline, not boxes) ---------- */}
      <section className="border-y border-[var(--border)]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-28 sm:px-6 lg:w-4/5">
          <div className="text-center">
            <Reveal className="text-center">
              <span className="chip mx-auto">How it works</span>
            </Reveal>
            <Reveal className="text-center" delay={90}>
              <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Three steps to a plan you&apos;ll follow
              </h2>
            </Reveal>
          </div>
          <div className="relative mt-14 grid gap-12 sm:grid-cols-3">
            {/* connecting line */}
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent sm:block" />
            {STEPS.map((s) => (
              <div key={s.n} className="rise relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-solid)] ring-1 ring-[var(--brand)]/40">
                  <span className="font-display font-bold text-[var(--brand)]">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{s.t}</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Testimonials marquee ---------- */}
      <section className="py-20">
        <div className="mx-auto mb-10 w-full max-w-[1600px] px-4 text-center sm:px-6 lg:w-4/5">
          <Reveal className="text-center">
            <span className="chip mx-auto">Loved by planners</span>
          </Reveal>
          <Reveal className="text-center" delay={90}>
            <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              People are getting to{" "}
              <span className="text-gradient">zero</span>
            </h2>
          </Reveal>
          <Reveal className="text-center" delay={180}>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
              Illustrative
            </p>
          </Reveal>
        </div>
        <div className="marquee-mask">
          <div className="marquee-track gap-4">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <figure
                key={i}
                className="w-[300px] shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--elevate)] p-6"
              >
                <div className="text-[var(--accent)]">★★★★★</div>
                <blockquote className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/90">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-xs">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[var(--muted)]"> · {t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-24 sm:px-6 lg:w-4/5">
        <div className="mb-8 text-center">
          <Reveal className="text-center">
            <span className="chip mx-auto">FAQ</span>
          </Reveal>
          <Reveal className="text-center" delay={90}>
            <h2 className="font-display mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Questions, answered
            </h2>
          </Reveal>
        </div>
        <Faq />
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden py-36">
        {/* atmospheric close */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand)]/12 blur-[150px]" />
        <div className="grid-overlay pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 text-center sm:px-6 lg:w-4/5">
          <Reveal className="text-center">
            <p className="kicker">The last step</p>
          </Reveal>
          <Reveal className="text-center" delay={90}>
            <h2 className="font-display mx-auto mt-5 max-w-4xl text-5xl font-bold leading-[0.98] tracking-[-0.035em] sm:text-7xl">
              Your debt-free date is
              <br />
              <span className="text-gradient">closer than you think.</span>
            </h2>
          </Reveal>
          <Reveal className="text-center" delay={180}>
            <p className="mx-auto mt-7 max-w-xl text-base text-[var(--muted)]">
              Start free forever. Ledger Pro unlocks unlimited debts, your full
              schedule, and CSV export for{" "}
              <span className="font-semibold text-[var(--foreground)]">
                ${yearlyMonthlyEquivalent}/mo
              </span>{" "}
              billed yearly (save {yearlySavingsPct}%), or $
              {PRICING.monthlyPrice}/mo.
            </p>
          </Reveal>
          <Reveal className="text-center" delay={270}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button
                onClick={goApp("final_cta")}
                className="btn-white group flex items-center gap-1.5 px-8 py-3.5 text-sm"
              >
                Build my plan
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
              <Link
                href="/pricing"
                className="rounded-full border border-[var(--border-strong)] px-8 py-3.5 text-sm font-semibold transition hover:bg-[var(--elevate)]"
              >
                Compare plans
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:w-4/5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="font-display text-lg font-semibold">Ledger</span>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
                A calm, private way to plan your way out of debt. Estimates only —
                not financial advice.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                ["Planner", "/app"],
                ["Pricing", "/pricing"],
                ["Settings", "/settings"],
              ]}
            />
            <FooterCol
              title="Learn"
              links={[
                ["Avalanche vs Snowball", "/avalanche-vs-snowball"],
                ["How it works", "/how-it-works"],
                ["FAQ", "/faq"],
              ]}
            />
            <div>
              <p className="kicker">Stay on track</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  track("start_free", { source: "footer_newsletter" });
                  router.push("/app");
                }}
                className="glass mt-3 flex items-center gap-1 rounded-full p-1"
              >
                <input
                  type="email"
                  placeholder="Email"
                  className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-xs outline-none placeholder:text-[var(--muted)]"
                />
                <button className="btn-white px-3 py-1.5 text-xs">Start</button>
              </form>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row">
            <span>© 2026 Ledger. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-[var(--foreground)]">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-[var(--foreground)]">
                Terms
              </Link>
              <span>Private &amp; secure.</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="kicker">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
