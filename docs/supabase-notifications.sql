-- Ledger — email notification preferences on profiles.
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.
-- Writes happen via the service role (settings handler / cron); users only read.

alter table public.profiles
  add column if not exists email_reminders    boolean not null default true,
  add column if not exists reminder_lead_days int not null default 3,
  add column if not exists weekly_summary     boolean not null default true,
  add column if not exists currency           text not null default 'USD',
  add column if not exists last_reminder_at   timestamptz,
  add column if not exists last_summary_at    timestamptz;
