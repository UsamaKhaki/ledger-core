# Ledger — Debt Planner 🪐

A private, browser-first debt-payoff planner with a cinematic marketing site.
List your debts, pick avalanche or snowball, see the exact date you'll be
debt-free, and track every payment — plus how much interest a little extra each
month saves you. Free to start, no signup required to use the planner.

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — quick project guide, commands, conventions, gotchas.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — layers, data flow, and extension points.
- **[docs/API.md](./docs/API.md)** — the ts-rest API reference.
- **[docs/DESIGN.md](./docs/DESIGN.md)** — the "Gravity → Weightless" design system.

## Features

- **Avalanche vs. Snowball** — compare both strategies on your real numbers.
- **Debt-free date** — a real projected date; an extra-payment slider shows the
  interest and months you'd save.
- **Payment tracking** — progress bars, milestone celebrations, per-debt payoff dates.
- **Amortization schedule + CSV export** (Pro).
- **14 currencies**, dark cinematic UI with a WebGL hero globe.
- **Accounts** (prototype) — email/password auth via a typed ts-rest API.

## Tech stack

- Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- Three.js (`@react-three/fiber` + `drei`) · Recharts
- ts-rest (`@ts-rest/core` + `@ts-rest/serverless`) for the typed API
- Fonts: Bricolage Grotesque · Geist · Geist Mono

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000  (dev is slow — see note)
```

For an accurate feel of performance, use the production build:

```bash
npm run build && npm run start
```

## Status & roadmap

Planner data is stored in the browser (localStorage). Auth is a **prototype** with
an in-memory mock provider behind a Supabase-shaped interface — see the swap
points in `ARCHITECTURE.md`. Next: Supabase (persistence + cloud sync), Stripe
billing, payment reminders.

> Estimates only. Interest is compounded monthly and assumes fixed balances and
> rates. Not financial advice.
