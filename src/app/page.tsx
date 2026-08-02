"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/analytics";
import {
  PRICING,
  yearlyMonthlyEquivalent,
  yearlySavingsPct,
} from "@/lib/tiers";
import { HeroPreview } from "@/components/HeroPreview";
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
      <section className="relative">
        {/* decorative glow orbs (imagery, not boxes) */}
        <div className="blob left-[8%] top-[6%] h-72 w-72 bg-[#3b5bd0]" />
        <div
          className="blob right-[4%] top-[24%] h-80 w-80 bg-[#2f7d6b]"
          style={{ animationDelay: "-6s" }}
        />
        <div className="grid-overlay pointer-events-none absolute inset-0" />

        <div className="relative mx-auto w-full max-w-[1600px] px-4 pt-14 pb-10 sm:px-6 sm:pt-20 lg:w-4/5">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div
                className="hero-in flex flex-wrap items-center gap-2"
                style={{ animationDelay: "0.05s" }}
              >
                <span className="flex items-center gap-2 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-1.5 text-xs font-medium text-[var(--success)]">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                  Free forever
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/80">
                  🔒 100% private
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/80">
                  ⚡ Ready in 2 minutes
                </span>
              </div>
              <h1
                className="hero-in font-display mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.035em] sm:text-6xl"
                style={{ animationDelay: "0.14s" }}
              >
                <span className="text-gradient">Get Out of Debt.</span>
                <br />
                Simply and Smartly.
              </h1>
              <p
                className="hero-in mt-6 max-w-lg text-sm leading-relaxed text-[var(--muted)] sm:text-base"
                style={{ animationDelay: "0.24s" }}
              >
                Turn a pile of balances into one calm plan. See the exact order to
                pay, the date you&apos;ll be free, and how much interest
                you&apos;ll save — in minutes.
              </p>

              <form
                onSubmit={start}
                style={{ animationDelay: "0.34s" }}
                className="hero-in glass mt-8 flex max-w-md items-center gap-2 rounded-full p-1.5 transition focus-within:border-[var(--brand)]/60 focus-within:ring-2 focus-within:ring-[var(--brand)]/15"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (optional)"
                  className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-[var(--muted)]"
                />
                <button
                  type="submit"
                  className="btn-white group flex shrink-0 items-center gap-1.5 px-5 py-2.5 text-sm"
                >
                  Get Started
                  <span className="text-[var(--brand)] transition-transform duration-200 group-hover:translate-x-0.5">
                    ↗
                  </span>
                </button>
              </form>

              <div
                className="hero-in mt-8 flex items-center gap-3"
                style={{ animationDelay: "0.44s" }}
              >
                <div className="flex -space-x-2.5">
                  {[
                    "from-[#5b7cfa] to-[#8fb0ff]",
                    "from-[#45c795] to-[#8fe3c0]",
                    "from-[#e2b25c] to-[#f2d391]",
                  ].map((g) => (
                    <span
                      key={g}
                      className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} ring-2 ring-[var(--background)]`}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-none">
                    $0 to start
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Free forever for up to 3 debts.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="hero-in mt-8 lg:mt-0"
              style={{ animationDelay: "0.3s" }}
            >
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats band ---------- */}
      <section className="border-y border-[var(--border)] bg-white/[0.015]">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-y-10 px-4 py-14 sm:grid-cols-4 sm:px-6 lg:w-4/5">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center text-center ${
                i > 0 ? "sm:border-l sm:border-[var(--border)]" : ""
              }`}
            >
              <StatCounter
                value={s.value}
                suffix={s.suffix}
                className="font-display text-gradient text-4xl font-bold tracking-tight sm:text-5xl"
              />
              <span className="mt-2 h-0.5 w-8 rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--success)] opacity-60" />
              <p className="mt-2 text-xs text-[var(--muted)]">{s.label}</p>
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
              className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[var(--foreground)]/85 transition hover:border-[var(--border-strong)] hover:bg-white/[0.06]"
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Alternating graphic rows (replaces box grids) ---------- */}
      <section className="mx-auto w-full max-w-[1600px] space-y-24 px-4 py-20 sm:px-6 lg:w-4/5">
        {/* Row 1 — balance chart */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="chip">Your debt-free date</span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Watch your balance fall to zero
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
              <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
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
              <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
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
        <div className="mx-auto w-full max-w-[1600px] px-4 py-20 sm:px-6 lg:w-4/5">
          <div className="text-center">
            <Reveal className="text-center">
              <span className="chip mx-auto">How it works</span>
            </Reveal>
            <Reveal className="text-center" delay={90}>
              <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
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
            <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              People are getting to zero
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
                className="glass w-[300px] shrink-0 rounded-2xl p-6"
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
      <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 lg:w-4/5">
        <div className="mb-8 text-center">
          <Reveal className="text-center">
            <span className="chip mx-auto">FAQ</span>
          </Reveal>
          <Reveal className="text-center" delay={90}>
            <h2 className="font-display mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Questions, answered
            </h2>
          </Reveal>
        </div>
        <Faq />
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative py-20">
        <div className="blob left-1/2 top-1/2 h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 bg-[#3b5bd0]" />
        <div className="relative mx-auto w-full max-w-[1600px] px-4 text-center sm:px-6 lg:w-4/5">
          <Reveal className="text-center">
            <p className="kicker">Simple pricing</p>
          </Reveal>
          <Reveal className="text-center" delay={90}>
            <h2 className="font-display mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
              Your debt-free date is closer than you think.
            </h2>
          </Reveal>
          <Reveal className="text-center" delay={180}>
            <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--muted)]">
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
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={goApp("final_cta")}
                className="btn-white px-7 py-3 text-sm"
              >
                Build my plan →
              </button>
              <Link
                href="/pricing"
                className="rounded-full border border-[var(--border-strong)] px-7 py-3 text-sm font-semibold transition hover:bg-white/5"
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
                ["Avalanche vs Snowball", "/#"],
                ["How it works", "/#"],
                ["FAQ", "/#"],
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
          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row">
            <span>© 2026 Ledger. All rights reserved.</span>
            <span>Your data stays in your browser.</span>
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
