# Architecture

Ledger is a Next.js 16 app. Debts, payments, accounts, billing and notifications
go through one typed API layer (ts-rest). Each integration is env-gated: with
Supabase configured, auth and data use Supabase (RLS scopes rows to the user);
without it, an in-memory mock provider and fixture store keep local dev working.
Stripe, Resend, Upstash and Sentry follow the same pattern. UI preferences stay
in localStorage.

```
┌───────────────────────────── Browser ─────────────────────────────┐
│  Marketing (/)      Planner (/app)      Pricing/Settings/Auth       │
│      │                   │                        │                 │
│  React 19 client components + contexts (Auth, Money, Subscription)  │
│      │                   │                        │                 │
│  useLocalStorage (useSyncExternalStore)   ts-rest client (api.*)    │
│  debts · payments · settings · plan             │  fetch (cookies)  │
└─────────────────────────────────────────────────┼──────────────────┘
                                                   ▼
                          Next Route Handler  /api/[...ts-rest]
                                                   │
                              ts-rest router (implements contract)
                                                   │
                                     AuthProvider (swap point)
                                 Supabase (or mock in dev)
```

## Layers

### 1. Presentation (`src/app`, `src/components`)
Client components. The marketing site (`/`) is a scroll-driven, motion-rich page;
the planner (`/app`) has an Overview tab (accounts, upcoming payments) and a
Plan tab (strategy, extra payment, chart, comparison, schedule). Shared primitives live in
`components/ui.tsx` (`Card`, `StatStrip`) and `components/graphics.tsx`
(`BalanceGraphic`, `ProgressRing`, `StrategyBars`). Reveal choreography is
`Reveal.tsx` (IntersectionObserver) + `.hero-in`/`.rise` CSS.

### 2. Design system (`src/app/globals.css`)
A dark-first "Gravity → Weightless" theme with a light variant. **CSS variables are the contract**
between components and the theme; components never hardcode colors. Utility
classes (`.glass`, `.chip`, `.btn-white`, `.kicker`, `.font-display`,
`.font-mono-num`, `.text-gradient`, motion helpers) keep every page consistent;
re-theming is done by editing tokens, not components.

### 3. State & persistence
- **Debts + payments** are loaded and mutated through the API via
  `src/lib/useDebtsData.ts` (calls the ts-rest client). On the server,
  `src/lib/api/data.ts` uses Supabase when it is configured and otherwise the
  in-memory store (`src/lib/api/store.ts`, seeded from `fixtures.ts`).
- **UI preferences** (`strategy`, `extra`, `settings`) use **`useLocalStorage`**
  (`src/lib/useLocalStorage.ts`), which wraps `useSyncExternalStore` so it is
  SSR-safe and never calls `setState` in an effect. Keys are namespaced
  `debtplanner.*`.
- **Contexts** (in `src/app/providers.tsx`, order matters): `AuthProvider` →
  `MoneyProvider` (currency + formatting) → `SubscriptionProvider` (free/pro tier).

### 4. Domain logic (`src/lib/debt.ts`)
Pure, framework-free. `buildPlan(debts, monthlyBudget, strategy)` simulates the
payoff month-by-month (interest accrual → minimums → roll extra into the target
debt) and returns the schedule, debt-free date, per-debt payoff, and totals. It
handles infeasible budgets and interest-outpaces-payment cases. This module has
no React/DOM dependencies and is the natural place for unit tests.

### 5. API layer (ts-rest): `src/lib/api`, `src/app/api/[...ts-rest]`
- **`contract.ts`**: the single source of truth. Endpoints are declared with
  `c.type<>()` (pure TS types, no runtime schema) so request/response shapes are
  type-checked on both ends. Nested under resources (`{ auth: authContract }`).
- **`src/app/api/[...ts-rest]/route.ts`**: one catch-all `createNextHandler`
  (`handlerType: 'app-router'`) implements the contract by delegating to the auth
  provider and data layer, exported as `GET`/`POST`/`PATCH`/`DELETE`. Every
  request body is checked by `validate.ts` before it reaches the data layer,
  because `c.type<>()` gives no runtime validation.
- **`client.ts`**: `initClient(contract)` gives `api.auth.login(...)` etc., fully
  typed, same-origin (session cookie rides along).

Adding a resource: define it in `contract.ts`, implement it in the router, call
it via `api`. No manual fetch, no drift between client and server.

### 6. Auth (`src/lib/auth`): the provider pattern
`types.ts` defines `AuthProvider` (`signUp`/`signIn`/`signOut`/`getUser`) shaped
after Supabase Auth. `mock-provider.ts` implements it with an in-memory user map,
scrypt-hashed+salted passwords, and an httpOnly `ledger_session` cookie (via
`next/headers`). `supabase-provider.ts` is the production implementation;
`index.ts` picks one per request (Supabase when configured) and refuses the mock
in production unless `ALLOW_MOCK_DATA=true`. `useAuth.tsx` is the client context that talks
to the API through the ts-rest client.

### 7. Monetization (`src/lib/tiers.ts`, `subscription.tsx`, `analytics.ts`)
Freemium: Free = 3 debts; Pro = unlimited debts, amortization schedule, CSV
export and email reminders. The UI gates features in `/app` (debt limit →
`UpgradeModal`) and `AmortizationTable` (blurred teaser). With Stripe
configured, the server enforces the same rules: `guards.ts` caps debts and the
reminders cron skips non-Pro profiles, both using the entitlement rules in
`tiers.ts`. Without Stripe, `subscription.tsx` simulates the plan in the
browser. `analytics.track()` is a provider-agnostic funnel shim.

### 8. 3D hero + performance tiering
`HeroVisual.tsx` decides what renders: a **capability gate** (reduced-motion,
touch, small screen, low cores/memory → SVG `FallbackGlobe`) plus a **runtime FPS
probe** that downgrades WebGL → SVG if it can't hold ~45fps. `Hero3D.tsx` is the
`@react-three/fiber` particle-globe + connection-arc network; it caps DPR, uses a
sprite texture for round points, and **pauses rendering when scrolled off-screen**.

## Data flow examples

- **Log a payment:** `/app` → `useDebtsData.logPayment()` → `api.payments.log()` →
  store reduces the balance and returns `{ payment, debt, cleared }` → hook updates
  state → `buildPlan` recomputes → chart/ring/stat-strip re-render → milestone
  celebration if `cleared`.
- **Log in:** `useAuth.login()` → `api.auth.login()` → `/api/[...ts-rest]` →
  `auth.signIn()` sets the session cookie → the form does a full navigation to
  `/app`, so the server renders it with the new session (a client-side push
  could replay a `/app` prefetch made while signed out).

## Integration status

| Area | Status |
| --- | --- |
| Accounts | Supabase provider in `auth/supabase-provider.ts`; mock provider for local dev |
| Debts and payments | Supabase tables with RLS (`docs/supabase-schema.sql`); fixture store for local dev |
| Billing | Stripe Checkout + webhook (`docs/supabase-billing.sql`); local simulation when unconfigured |
| Reminders | Daily Vercel cron + Resend (`docs/supabase-notifications.sql`), Pro only |
| Analytics | `analytics.track()` is still a shim with no provider |
