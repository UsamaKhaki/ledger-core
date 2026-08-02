# Debt Planner 🏔️

A private, browser-based debt payoff planner. List your debts, pick a payoff
strategy, and see exactly when you'll be debt-free — plus how much interest a
little extra each month saves you. No signup, no server: everything lives in
your browser's local storage.

## Features

- **Add debts** — name, balance, APR, and minimum payment.
- **Avalanche vs. Snowball** — toggle strategies and see the payoff order.
  - _Avalanche_: attack the highest interest rate first (saves the most money).
  - _Snowball_: attack the smallest balance first (fastest wins, best for motivation).
- **Side-by-side comparison** — see exactly how much money and time Avalanche
  saves you over Snowball.
- **Extra-payment slider** — drag it and watch your debt-free date jump earlier
  and your interest drop.
- **Payoff summary** — total debt, debt-free date, total interest, and monthly
  payment at a glance.
- **Balance-over-time chart** — visualize your journey to $0.
- **Per-debt payoff dates** — know when each individual debt is cleared.
- **Private by default** — data is stored only in your browser (localStorage).

## Tech stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- Recharts

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Try it with
sample debts** to see it in action instantly.

## How the math works

The engine (`src/lib/debt.ts`) simulates month by month: it accrues interest
(APR compounded monthly), pays every debt's minimum, then pours all remaining
budget into the target debt for the chosen strategy. As each debt clears, its
freed-up minimum rolls into the next target (the "snowball" effect). It flags
plans where the budget can't cover the minimums, or where interest outpaces
payments.

> Estimates only. Assumes fixed balances and rates. Not financial advice.

## Roadmap ideas

- Log real payments and track progress against the plan
- Milestone celebrations as each debt clears
- Optional cloud sync + accounts (database + auth) for multi-device use
- Reminders / notifications for upcoming payments

## Deploy

This is a static Next.js app — deploy to Vercel with `vercel` (or push to a Git
repo connected to Vercel). No environment variables or database required.
