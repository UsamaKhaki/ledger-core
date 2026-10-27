// Scheduled job: emails due-date reminders and a weekly progress summary.
// Triggered by a cron (e.g. Vercel Cron) hitting this route once a day. Secured
// by CRON_SECRET (Vercel sends it as `Authorization: Bearer <CRON_SECRET>`).
//
// Idempotency: a reminder fires when a payment is due in exactly `leadDays` days
// (or on the due day), at most once per calendar day. The weekly summary fires
// at most once every 7 days. Both tracked via timestamps on the profile.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { reminderEmail, summaryEmail } from "@/lib/email/templates";
import { dueInfo } from "@/lib/cards";
import { LIMITS } from "@/lib/tiers";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Emailed reminders are a Pro feature, so enforce it where the send actually
 * happens — a UI-only gate would be decorative.
 *
 * Only enforced when Stripe is configured. Without it the app runs in
 * local-simulation billing mode (see `subscription.tsx`), where nobody's
 * profile is ever marked "pro" and this would silently email no one.
 */
function planAllowsReminders(profile: {
  plan?: string | null;
  subscription_status?: string | null;
}): boolean {
  if (!isStripeConfigured()) return true;
  const active =
    profile.subscription_status === "active" ||
    profile.subscription_status === "trialing";
  const isPro = profile.plan === "pro" && active;
  return LIMITS[isPro ? "pro" : "free"].reminders;
}

function sameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type DebtRow = {
  name: string;
  balance: number;
  starting_balance: number;
  min_payment: number;
  due_day: number | null;
};

async function run(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "supabase not configured" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const now = Date.now();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const appUrl = `${base}/app`;
  const WEEK = 7 * 24 * 60 * 60 * 1000;

  // Both of these MUST paginate. PostgREST caps a select at 1000 rows and
  // `listUsers()` returns one page (50) by default — without this, every user
  // past the first page silently stops receiving reminders, and nothing in the
  // response would show it.
  const PROFILE_PAGE = 500;
  const profiles: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PROFILE_PAGE) {
    const { data: page, error } = await admin
      .from("profiles")
      .select(
        "id,display_name,email_reminders,reminder_lead_days,weekly_summary,currency,last_reminder_at,last_summary_at,plan,subscription_status",
      )
      .order("id", { ascending: true })
      .range(from, from + PROFILE_PAGE - 1);
    if (error) {
      console.error("[cron/reminders] profile page failed:", error.message);
      return Response.json({ error: "could not load profiles" }, { status: 500 });
    }
    if (!page || page.length === 0) break;
    profiles.push(...page);
    if (page.length < PROFILE_PAGE) break;
  }

  // Map user id → email, walking every page of the auth user list.
  const emailById = new Map<string, string | undefined>();
  const USER_PAGE = 1000;
  for (let page = 1; ; page++) {
    const { data: userList, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USER_PAGE,
    });
    if (error) {
      console.error("[cron/reminders] listUsers page failed:", error.message);
      return Response.json({ error: "could not load users" }, { status: 500 });
    }
    const users = userList?.users ?? [];
    for (const u of users) emailById.set(u.id, u.email ?? undefined);
    if (users.length < USER_PAGE) break;
  }

  let remindersSent = 0;
  let summariesSent = 0;
  let reminderCandidates = 0;
  let summaryCandidates = 0;
  let skippedNotPro = 0;

  for (const p of profiles as any[]) {
    const email = emailById.get(p.id);
    if (!email) continue;

    const { data: rows } = await admin
      .from("debts")
      .select("name,balance,starting_balance,min_payment,due_day")
      .eq("user_id", p.id);
    const debts = (rows ?? []) as DebtRow[];
    const active = debts.filter((d) => Number(d.balance) > 0.005);
    if (active.length === 0) continue;

    const name = p.display_name ?? "";
    const currency = p.currency ?? "USD";

    if (!planAllowsReminders(p)) {
      skippedNotPro++;
      continue;
    }

    // ── Due-date reminders ──
    if (p.email_reminders) {
      const lead = p.reminder_lead_days ?? 3;
      const dueSoon = active
        .filter((d) => d.due_day != null)
        .map((d) => ({ d, info: dueInfo(d.due_day as number, now) }))
        .filter((x) => x.info.daysUntil === lead || x.info.daysUntil === 0);
      const alreadyToday =
        p.last_reminder_at && sameDay(new Date(p.last_reminder_at).getTime(), now);

      if (dueSoon.length > 0 && !alreadyToday) {
        reminderCandidates++;
        if (isEmailConfigured()) {
          const html = reminderEmail({
            name,
            currency,
            items: dueSoon.map((x) => ({
              name: x.d.name,
              amount: Number(x.d.min_payment),
              label: x.info.label,
            })),
            appUrl,
          });
          const r = await sendEmail({
            to: email,
            subject: `Payment reminder — ${dueSoon.length} due soon`,
            html,
          });
          if (r.ok) {
            remindersSent++;
            await admin
              .from("profiles")
              .update({ last_reminder_at: new Date(now).toISOString() })
              .eq("id", p.id);
          } else {
            console.error("[cron/reminders] send failed:", r.error);
          }
        }
      }
    }

    // ── Weekly progress summary ──
    if (p.weekly_summary) {
      const last = p.last_summary_at ? new Date(p.last_summary_at).getTime() : 0;
      if (now - last >= WEEK) {
        summaryCandidates++;
        if (isEmailConfigured()) {
          const totalOwed = active.reduce((s, d) => s + Number(d.balance), 0);
          const totalStart = debts.reduce(
            (s, d) => s + Math.max(Number(d.starting_balance), Number(d.balance)),
            0,
          );
          const totalNow = debts.reduce((s, d) => s + Number(d.balance), 0);
          const paid = Math.max(0, totalStart - totalNow);
          const pct = totalStart > 0 ? Math.round((paid / totalStart) * 100) : 0;

          const html = summaryEmail({
            name,
            currency,
            totalOwed,
            paid,
            pct,
            accounts: active.length,
            appUrl,
          });
          const r = await sendEmail({
            to: email,
            subject: "Your weekly debt progress",
            html,
          });
          if (r.ok) {
            summariesSent++;
            await admin
              .from("profiles")
              .update({ last_summary_at: new Date(now).toISOString() })
              .eq("id", p.id);
          } else {
            console.error("[cron/reminders] summary send failed:", r.error);
          }
        }
      }
    }
  }

  return Response.json({
    ok: true,
    emailConfigured: isEmailConfigured(),
    profilesScanned: profiles.length,
    skippedNotPro,
    reminderCandidates,
    summaryCandidates,
    remindersSent,
    summariesSent,
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}
