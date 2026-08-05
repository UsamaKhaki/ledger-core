-- Ledger — billing columns + RLS hardening for Stripe.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.

-- ── billing state on profiles ────────────────────────────────────────────────
alter table public.profiles
  add column if not exists stripe_customer_id   text,
  add column if not exists plan                 text not null default 'free',
  add column if not exists billing              text,          -- 'monthly' | 'yearly'
  add column if not exists subscription_status  text,          -- active | trialing | past_due | canceled | ...
  add column if not exists price_id             text,
  add column if not exists current_period_end   timestamptz;

create index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id);

-- ── RLS hardening ────────────────────────────────────────────────────────────
-- The old "for all" self policy let a user UPDATE their own profile — including
-- plan='pro'. That would let anyone grant themselves Pro for free. Replace it
-- with SELECT-only for users; all billing writes happen via the service-role
-- key in the Stripe webhook (which bypasses RLS), and profile rows are created
-- by the security-definer signup trigger.
drop policy if exists "profiles are self"       on public.profiles;
drop policy if exists "profiles self select"    on public.profiles;

create policy "profiles self select" on public.profiles
  for select using (auth.uid() = id);

-- (No INSERT/UPDATE/DELETE policy for users → those are denied by default.)
