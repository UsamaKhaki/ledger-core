# Ledger

A debt payoff planner. You list your debts, choose the avalanche or snowball
strategy, and Ledger simulates the payoff month by month to show your
debt-free date, total interest, and how much an extra monthly payment saves.
You can log payments as you make them and track progress per debt.

Built with Next.js 16 (App Router), React 19, TypeScript, Supabase, Stripe and
a typed ts-rest API.

## Features

- **Payoff engine**: month-by-month simulation of interest, minimums and the
  rolled-over extra payment, with avalanche vs snowball comparison. Handles
  budgets that cannot cover the minimums and debts whose interest outpaces the
  payment (`src/lib/debt.ts`, unit tested).
- **Debt tracking**: credit and store cards render as card tiles, loans as
  progress rows. Payments update balances and trigger a milestone when a debt
  is cleared.
- **CSV import and export** with per-row validation.
- **Accounts**: email and password auth, password reset and email confirmation
  through Supabase Auth.
- **Freemium billing**: Free tracks up to 3 debts; Pro adds unlimited debts, the
  amortization schedule, CSV export and email reminders. Stripe Checkout and a
  webhook set the plan. Limits are enforced on the server, not only in the UI.
- **Email reminders**: a daily Vercel cron sends due-date reminders and a
  weekly summary through Resend (Pro only).
- **14 currencies**, light and dark themes, and a WebGL hero globe that falls
  back to SVG on low-end devices or when the frame rate drops.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 with CSS variable design tokens |
| API | ts-rest contract (`src/lib/api/contract.ts`) served by one catch-all route |
| Auth and data | Supabase (Postgres with row-level security) |
| Billing | Stripe Checkout and webhooks |
| Email | Resend |
| Rate limiting | Upstash Redis, in-memory fallback |
| Monitoring | Sentry |
| 3D | Three.js via `@react-three/fiber` and `drei` |
| Charts | Recharts |
| Tests | Vitest |

## Architecture

```
React client ──ts-rest client──▶ /api/[...ts-rest] ──▶ validate.ts ──▶ guards.ts ──▶ data layer
                                                                                    │
                                                              Supabase (RLS)  or  in-memory store (dev)
```

- The **contract** is the single source of truth for request and response
  types. Because `c.type<>()` is compile-time only, every body goes through the
  pure validators in `src/lib/api/validate.ts` before it reaches the database.
- **Guards** (`src/lib/api/guards.ts`) resolve the session and enforce plan
  limits.
- **Every integration is env-gated.** Without Supabase env vars the app uses an
  in-memory auth provider and fixture store, so it runs locally with no
  services. In production that fallback refuses to serve requests unless
  `ALLOW_MOCK_DATA=true`, because it is one shared dataset for all visitors.
- **Auth gating** happens twice: `src/proxy.ts` refreshes the session and
  redirects early, and the `/app` and `/settings` server layouts make the
  authoritative check.

More detail: [ARCHITECTURE.md](./ARCHITECTURE.md), [docs/API.md](./docs/API.md),
[docs/DESIGN.md](./docs/DESIGN.md).

## Getting started

Requires Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no env vars set, you can sign in with the
seeded demo account `demo@ledger.app` / `password123` (local mock only).

### Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. Each group is
optional; leaving it empty disables that integration.

| Group | Variables |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Site | `NEXT_PUBLIC_SITE_URL` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` |
| Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |
| Demo deploys | `ALLOW_MOCK_DATA` |

Database setup: run `docs/supabase-schema.sql`, `docs/supabase-billing.sql` and
`docs/supabase-notifications.sql` in the Supabase SQL editor. To create the
Stripe product and prices in test mode, run
`STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-products.mjs`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build (use this to judge performance) |
| `npm run lint` | ESLint (Next.js core web vitals and TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and the build on
pushes to `main` and on pull requests.

## Testing

Unit tests cover the business logic that is easiest to get wrong:

- `src/lib/debt.test.ts`: payoff simulation, strategy ordering, infeasible budgets
- `src/lib/importCsv.test.ts`: CSV parsing and row validation
- `src/lib/rateLimit.test.ts`: the fixed-window limiter
- `src/lib/api/validate.test.ts`: request body validation
- `src/lib/api/store.test.ts`: balance and payment rules in the dev store
- `src/lib/api/contract.test.ts`: every HTTP method in the contract is exported by the route

There are no integration or end-to-end tests yet. The Supabase, Stripe and
cron paths have been exercised manually only.

## Status and limitations

- Working product with real integrations, not yet launched.
- `ts-rest` is pinned to `3.53.0-rc.1`, because stable 3.52 breaks type
  inference under TypeScript 5.9. Its peer ranges are out of date, hence
  `legacy-peer-deps` in `.npmrc`.
- Without Stripe configured, billing runs in a local simulation where "Pro" is
  stored in the browser, and server-side plan limits are not enforced.
- The CSP omits `script-src` until per-request nonces are added (see
  `next.config.ts`).
- `analytics.track()` is a stub with no provider behind it.
- Estimates assume fixed rates and monthly compounding. Not financial advice.
