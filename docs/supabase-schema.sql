-- Ledger — Supabase schema + Row-Level Security
-- Paste this into the Supabase dashboard → SQL Editor → Run.
-- Safe to re-run.

-- ── profiles (1:1 with auth.users) ───────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self" on public.profiles;
create policy "profiles are self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── debts / cards ────────────────────────────────────────────────────────────
create table if not exists public.debts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name             text not null,
  kind             text not null default 'other',
  issuer           text,
  balance          numeric not null default 0,
  starting_balance numeric not null default 0,
  apr              numeric not null default 0,
  min_payment      numeric not null default 0,
  credit_limit     numeric,
  due_day          int,
  created_at       timestamptz not null default now()
);

alter table public.debts enable row level security;

drop policy if exists "debts are self" on public.debts;
create policy "debts are self" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists debts_user_idx on public.debts(user_id);

-- ── payments ─────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  debt_id      uuid not null references public.debts(id) on delete cascade,
  amount       numeric not null,
  cleared_debt boolean not null default false,
  paid_at      timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "payments are self" on public.payments;
create policy "payments are self" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists payments_debt_idx on public.payments(debt_id);
