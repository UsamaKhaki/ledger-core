// Read/write a user's email notification preferences. Reads use the user
// session (RLS SELECT); writes go through the service role (profiles are
// SELECT-only for users), with the columns controlled here — same pattern as
// billing.

import type { NotificationPrefs } from "@/lib/types";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT: NotificationPrefs = {
  emailReminders: true,
  leadDays: 3,
  weeklySummary: true,
  currency: "USD",
};

export const notifications = {
  async get(): Promise<NotificationPrefs> {
    if (!isSupabaseConfigured()) return DEFAULT;
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return DEFAULT;

    const { data } = await sb
      .from("profiles")
      .select("email_reminders,reminder_lead_days,weekly_summary,currency")
      .eq("id", user.id)
      .single();

    return {
      emailReminders: data?.email_reminders ?? DEFAULT.emailReminders,
      leadDays: data?.reminder_lead_days ?? DEFAULT.leadDays,
      weeklySummary: data?.weekly_summary ?? DEFAULT.weeklySummary,
      currency: data?.currency ?? DEFAULT.currency,
    };
  },

  async update(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs | null> {
    if (!isSupabaseConfigured()) return { ...DEFAULT, ...patch };
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;

    const update: Record<string, unknown> = {};
    if (patch.emailReminders !== undefined)
      update.email_reminders = patch.emailReminders;
    if (patch.leadDays !== undefined) update.reminder_lead_days = patch.leadDays;
    if (patch.weeklySummary !== undefined)
      update.weekly_summary = patch.weeklySummary;
    if (patch.currency !== undefined) update.currency = patch.currency;

    if (Object.keys(update).length > 0) {
      await supabaseAdmin().from("profiles").update(update).eq("id", user.id);
    }
    return this.get();
  },
};
