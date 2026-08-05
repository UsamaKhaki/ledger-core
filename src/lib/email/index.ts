// Transactional email via Resend's HTTP API (no SMTP/SDK needed). Env-gated:
// with no RESEND_API_KEY, isEmailConfigured() is false and nothing is sent, so
// the app runs normally until you wire up a provider.

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "Ledger <onboarding@resend.dev>";

export const isEmailConfigured = () => !!RESEND_KEY;

export type EmailMessage = { to: string; subject: string; html: string };

export async function sendEmail(
  msg: EmailMessage,
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) return { ok: false, error: "email not configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `resend ${res.status}: ${await res.text()}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

/** Server-side money formatter (client uses useMoney; the cron can't). */
export function fmtMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en")}`;
  }
}
