# Ledger — Growth, Monetization & Production Roadmap

A senior-analyst plan to take Ledger from a polished prototype to a
revenue-generating product across **US, Canada, Europe, and the UAE**, with
first-class **multi-card / multi-account** tracking.

---

## 1. Where we are (honest baseline)

**Have:** cinematic marketing site, working payoff engine (avalanche/snowball),
payment tracking, freemium tiers + paywall (local), typed API (ts-rest),
prototype auth (mock, Supabase-shaped), 14 currencies, in-memory data store.

**Missing for revenue:** real persistence + accounts, real billing, per-user
data, reminders/notifications, localization, compliance, analytics, tests,
observability, and the multi-card data model.

The architecture is deliberately ready for this: `src/lib/auth/index.ts` and
`src/lib/api/store.ts` are single swap points; `src/lib/api/contract.ts` is the
one place the API grows.

---

## 2. Market & positioning

**Category:** personal debt-payoff planning (adjacent to budgeting).
**Comparables:** Undebt.it, Debt Payoff Planner, YNAB (budgeting), Rocket Money
(subscriptions/negotiation). Tally (debt manager) shut down — a gap to fill.

**Differentiation to lean into:**
1. **Privacy-first, no bank linking required** — huge trust advantage vs.
   aggregators, and it sidesteps open-banking cost/complexity early.
2. **Clarity of the "debt-free date"** as the hero metric.
3. **Multi-card / multi-account** clarity (see §4) — the daily-use hook.
4. **Truly multi-region** from day one (currency, language, RTL, compliance).

**Positioning line:** "See every card, one clear payoff plan, the exact day
you're free."

---

## 3. Monetization

Model: **freemium subscription** (already scaffolded). Refined plan:

| | Free | Pro |
| --- | --- | --- |
| Debts/cards | up to 3 | unlimited |
| Strategies, chart, debt-free date | ✓ | ✓ |
| Amortization schedule, CSV/PDF export | — | ✓ |
| Payment reminders & due-date calendar | — | ✓ |
| Cloud sync across devices | — | ✓ |
| Scenarios (what-if, refinance, consolidation) | 1 | unlimited |
| Insights & monthly report | — | ✓ |

**Pricing (regional, via Stripe + Purchasing Power / local price lists):**
- US $6/mo · $48/yr · CA C$8/mo · EU €6/mo (VAT incl.) · UAE AED 22/mo.
- Anchor on **annual** (2 months free); offer a **7-day Pro trial** (no card or
  card-required test both).
- Add **Stripe Tax** for VAT (EU/UAE) and US sales tax automatically.

**Secondary revenue (later, opt-in, disclosed):** affiliate referrals for
balance-transfer cards / refinance / debt consolidation — high intent, high
payout, but keep it non-creepy and clearly labeled to protect trust.

**Unit-economics levers:** activation (add ≥1 debt + see date), free→paid at the
3-debt / export / reminders walls, annual mix, churn via reminders + progress
gamification (the retention engine).

---

## 4. The multi-card / multi-account model (core product bet)

People don't think "debts" — they think "my Visa, my car, my Amex, my student
loan." Model that explicitly.

**Data model (Supabase / Postgres):**

```
profiles(id, display_name, base_currency, locale, country, created_at)
accounts(id, user_id, name, type)         -- optional grouping: "Personal", "Household"
debts(id, user_id, account_id, kind, name, issuer, currency,
      balance, starting_balance, apr, min_payment, credit_limit,
      statement_day, due_day, archived, created_at)
payments(id, user_id, debt_id, amount, paid_at, cleared_debt, note)
scenarios(id, user_id, name, extra_payment, strategy, params_json)
reminders(id, user_id, debt_id, due_day, channel, enabled)
```

`kind`: credit_card | store_card | personal_loan | auto_loan | student_loan |
mortgage | medical | bnpl | other. Cards add **credit_limit** →
**utilization %** (a metric users obsess over and a great insight/retention hook).

**Product features this unlocks:**
- **Per-card detail pages** with balance history, utilization gauge, statement/
  due dates, and this card's contribution to the plan.
- **Due-date calendar** + reminders (the #1 retention feature).
- **Multi-currency portfolios** (a UAE user with an AED card + a USD card) —
  convert to a base currency for the combined plan; store per-debt currency.
- **Accounts/grouping** for households or "mine vs. joint."
- **Utilization & credit-health nudges** ("pay $120 to drop Visa under 30%").
- **Scenarios**: extra payment, one-off windfall, balance transfer, consolidation.

**Engineering path:** extend `contract.ts` with `accounts`, `scenarios`,
`reminders`; the payoff engine already handles N debts — add currency conversion
and utilization. RLS scopes every table by `user_id`.

---

## 5. Regionalization (US · Canada · Europe · UAE)

| Concern | Plan |
| --- | --- |
| **Currency** | Done (14). Add per-debt currency + base-currency conversion (daily FX via a rates API, cached). |
| **Language / i18n** | `next-intl`. Ship **en** first; add **fr** (CA/EU), **de**, **ar** (UAE). Externalize strings now to avoid a painful retrofit. |
| **RTL (Arabic)** | `dir="rtl"` per locale; audit layouts (already avoid symbol-on-axis issues). Logical CSS props (`ms-`/`me-`). |
| **Formats** | Locale-aware number/date via `Intl` (already used for currency). |
| **Tax** | **Stripe Tax** — EU VAT, UAE 5% VAT, US sales tax, CA GST/HST. Show tax-inclusive pricing in EU/UAE. |
| **Payments** | Stripe: cards + Apple/Google Pay everywhere; **SEPA/iDEAL/Bancontact** (EU); local cards (UAE). |
| **Data residency** | Offer EU data region (Supabase EU project) for EU users; document processing locations. |
| **Compliance** | **GDPR** (EU), **UK-GDPR**, **PIPEDA** (CA), **CCPA/CPRA** (California), **UAE PDPL**. Consent banner, DPA, privacy policy, data export + delete (right to erasure), cookie/analytics consent. |
| **Trust/marketing** | "Not financial advice" disclaimer (present), clear no-bank-linking messaging, regional testimonials later. |

**Why privacy-first helps here:** no bank aggregation means far lighter
regulatory load (no PSD2/open-banking licensing) while still being useful — a
real strategic moat for a small team entering 4 regions.

---

## 6. Productionization (engineering)

Ordered by dependency.

1. **Auth + DB — Supabase.** Implement `supabase-provider.ts` (swap
   `auth/index.ts`), move `store.ts` to Supabase queries with **Row-Level
   Security**. Gate `/app` behind auth; migrate localStorage → account on first
   login.
2. **Billing — Stripe.** Products/prices per region, Checkout, Customer Portal,
   **webhooks** to set the plan server-side (never trust the client),
   entitlements read from DB. Wire `subscription.upgrade()` + pricing
   `startCheckout()`.
3. **Reminders/notifications.** Email (Resend/Postmark) + optional web push;
   scheduled via Vercel Cron hitting a route that queries due dates.
4. **Security.** RLS, input validation (add zod to the ts-rest contract),
   rate limiting, secure cookies (done), CSRF posture for mutations, secrets in
   Vercel env, dependency audit (currently 3 highs to clear + ts-rest RC pin).
5. **Observability.** Sentry (errors), Vercel Analytics/Speed Insights, product
   analytics (PostHog) — wire `analytics.track()` funnel that already exists.
6. **Quality.** Unit tests for `debt.ts` (pure, high-value) with Vitest;
   Playwright smoke for signup→add debt→pay→see plan; **CI** (typecheck + lint +
   build + tests) on every PR; preview deploys.
7. **SEO/content.** The marketing site + **free calculators** (payoff, balance
   transfer, snowball vs avalanche) as SEO lead magnets → the top of the funnel.
8. **Accessibility.** Keyboard/focus (started), color contrast, reduced motion
   (done), screen-reader labels on the interactive charts.
9. **Email lifecycle.** Welcome, activation nudge, "you're X% there", reminder
   digests, win-back.

---

## 7. Growth loops & funnel

- **Acquisition:** SEO calculators + content ("how to pay off credit card debt");
  app-store presence later (PWA/React Native wrapper); regional keyword variants.
- **Activation:** get to "debt-free date" fast — the aha moment. Instrument it.
- **Retention:** reminders, due-date calendar, progress/milestones, monthly
  report email. This is where subscription revenue is actually earned.
- **Referral:** "share your win" milestone cards; give-a-month referral.
- **Monetization triggers:** 3-debt wall, export, reminders, cloud sync, scenarios.

**KPIs to instrument now:** visitor→signup, signup→activated (added a debt),
activated→paid, trial→paid, monthly churn, ARPU by region, LTV:CAC.

---

## 8. Phased plan

- **P0 — Make it real (4–6 wks):** Supabase auth + DB + RLS, per-user data,
  Stripe billing + webhooks, gate `/app`, migrate localStorage, Sentry + PostHog,
  CI + tests, privacy policy + consent. → *can charge money.*
- **P1 — Multi-card depth (3–4 wks):** accounts, card fields (limit/utilization,
  statement/due), per-card pages, due-date calendar, reminders (email). → *daily
  use + retention.*
- **P2 — Regionalize (3–4 wks):** i18n (fr/de/ar) + RTL, Stripe Tax, regional
  pricing, SEPA/iDEAL, EU data region, per-debt currency + FX. → *unlock 4 markets.*
- **P3 — Growth (ongoing):** SEO calculators, scenarios (refinance/consolidation),
  insights & monthly report, referrals, affiliate (opt-in), mobile/PWA.

---

## 9. Recommended immediate next 6 steps

1. Stand up **Supabase** (auth + tables + RLS) and swap the mock provider/store.
2. Wire **Stripe** (test mode) with per-region prices, Checkout, portal, webhook.
3. Gate `/app`, migrate local data to the account on first login.
4. Add **zod** to the contract for runtime validation; add **Vitest** tests for
   `debt.ts`; turn on **CI**.
5. Ship the **multi-card model** (limit/utilization + due dates) and per-card pages.
6. Add **PostHog + Sentry** and a **privacy policy + consent** banner.

> Guardrail: keep the privacy-first, no-bank-linking promise — it's the moat and
> it keeps regulatory scope small while entering four regions.
