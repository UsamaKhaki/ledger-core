# Architecture

Ledger is a **client-first** Next.js 16 app. The planner runs entirely in the
browser today (localStorage), fronted by a typed API layer (ts-rest) that
currently backs authentication and is designed to grow into the server side as
Supabase/Stripe are added.

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
                                   mock today → Supabase later
```

## Layers

### 1. Presentation (`src/app`, `src/components`)
Client components. The marketing site (`/`) is a scroll-driven, motion-rich page;
the planner (`/app`) is a two-column tool. Shared primitives live in
`components/ui.tsx` (`Card`, `StatStrip`) and `components/graphics.tsx`
(`BalanceGraphic`, `ProgressRing`, `StrategyBars`). Reveal choreography is
`Reveal.tsx` (IntersectionObserver) + `.hero-in`/`.rise` CSS.

### 2. Design system (`src/app/globals.css`)
A single dark "Gravity → Weightless" theme. **CSS variables are the contract**
between components and the theme; components never hardcode colors. Utility
classes (`.glass`, `.chip`, `.btn-white`, `.kicker`, `.font-display`,
`.font-mono-num`, `.text-gradient`, motion helpers) keep every page consistent —
re-theming is done by editing tokens, not components.

### 3. State & persistence
- **Debts + payments** are loaded and mutated through the API via
  `src/lib/useDebtsData.ts` (calls the ts-rest client). The server side is an
  in-memory store (`src/lib/api/store.ts`) seeded from `fixtures.ts` — this is the
  seam Supabase slots into.
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

### 5. API layer (ts-rest) — `src/lib/api`, `src/app/api/[...ts-rest]`
- **`contract.ts`** — the single source of truth. Endpoints are declared with
  `c.type<>()` (pure TS types, no runtime schema) so request/response shapes are
  type-checked on both ends. Nested under resources (`{ auth: authContract }`).
- **`src/app/api/[...ts-rest]/route.ts`** — one catch-all `createNextHandler`
  (`handlerType: 'app-router'`) implements the contract by delegating to the auth
  provider, exported as `GET`/`POST`.
- **`client.ts`** — `initClient(contract)` gives `api.auth.login(...)` etc., fully
  typed, same-origin (session cookie rides along).

Adding a resource: define it in `contract.ts`, implement it in the router, call
it via `api`. No manual fetch, no drift between client and server.

### 6. Auth (`src/lib/auth`) — the provider pattern
`types.ts` defines `AuthProvider` (`signUp`/`signIn`/`signOut`/`getUser`) shaped
after Supabase Auth. `mock-provider.ts` implements it with an in-memory user map,
scrypt-hashed+salted passwords, and an httpOnly `ledger_session` cookie (via
`next/headers`). `index.ts` exports the active provider — **the one line you
change to go live with Supabase.** `useAuth.tsx` is the client context that talks
to the API through the ts-rest client.

### 7. Monetization (`src/lib/tiers.ts`, `subscription.tsx`, `analytics.ts`)
Freemium: Free = 3 debts; Pro = unlimited + amortization schedule + CSV export.
The paywall is enforced in `/app` (debt limit → `UpgradeModal`) and in
`AmortizationTable` (blurred teaser). `subscription.tsx` stores the plan locally
today; `upgrade()` is the Stripe Checkout wiring point. `analytics.track()` is a
provider-agnostic funnel shim.

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
  `auth.signIn()` sets the session cookie → `useAuth` stores the user → navbar
  shows the avatar.

## Extension roadmap

| Goal | Change |
| --- | --- |
| Real accounts | Add `supabase-provider.ts`, switch `auth/index.ts`, set env vars |
| Cloud-synced debts | New `debts` resource in the contract + Supabase table; migrate off localStorage |
| Real billing | Stripe Checkout in `subscription.upgrade()` + webhook to set the plan |
| Analytics | Replace the body of `analytics.track()` with a provider |
