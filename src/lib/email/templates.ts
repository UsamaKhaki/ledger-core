// Inline-styled HTML emails (email clients strip <style> and classes).

import { fmtMoney } from "./index";

const BRAND = "#4f46e5";
const INK = "#16181d";
const MUTED = "#5f6673";
const BORDER = "#e6e7eb";

function shell(inner: string, appUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${INK}">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden">
    <div style="padding:22px 24px;border-bottom:1px solid ${BORDER}">
      <span style="font-size:18px;font-weight:700;letter-spacing:-0.02em">Ledger</span>
    </div>
    <div style="padding:24px">${inner}</div>
    <div style="padding:16px 24px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED}">
      <a href="${appUrl}" style="color:${BRAND};text-decoration:none;font-weight:600">Open Ledger</a>
      &nbsp;·&nbsp; Manage these emails in Settings. Estimates only — not financial advice.
    </div>
  </div></body></html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:10px">${label}</a>`;
}

export function reminderEmail(opts: {
  name: string;
  currency: string;
  items: { name: string; amount: number; label: string }[];
  appUrl: string;
}): string {
  const rows = opts.items
    .map(
      (it) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px">${escapeHtml(it.name)}
          <div style="color:${MUTED};font-size:12px;margin-top:2px">${escapeHtml(it.label)}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${BORDER};text-align:right;font-size:14px;font-weight:600;white-space:nowrap">${fmtMoney(it.amount, opts.currency)}</td>
      </tr>`,
    )
    .join("");

  const inner = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:700">Payment${opts.items.length > 1 ? "s" : ""} coming up</h1>
    <p style="margin:0 0 18px;color:${MUTED};font-size:14px;line-height:1.6">
      ${opts.name ? `Hi ${escapeHtml(opts.name)}, ` : ""}a quick heads-up so nothing slips —
      here${opts.items.length > 1 ? " are the payments" : "'s the payment"} due soon.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${rows}</table>
    ${button("Log a payment", opts.appUrl)}
  `;
  return shell(inner, opts.appUrl);
}

export function summaryEmail(opts: {
  name: string;
  currency: string;
  totalOwed: number;
  paid: number;
  pct: number;
  accounts: number;
  appUrl: string;
}): string {
  const stat = (value: string, label: string) =>
    `<td style="padding:0 8px;text-align:center">
       <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em">${value}</div>
       <div style="color:${MUTED};font-size:12px;margin-top:2px">${label}</div>
     </td>`;

  const inner = `
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:700">Your weekly progress</h1>
    <p style="margin:0 0 18px;color:${MUTED};font-size:14px;line-height:1.6">
      ${opts.name ? `Hi ${escapeHtml(opts.name)} — ` : ""}here's where you stand across ${opts.accounts} account${opts.accounts === 1 ? "" : "s"}.
    </p>
    <div style="background:#f5f5f7;border-radius:12px;padding:18px 8px;margin-bottom:8px">
      <table style="width:100%;border-collapse:collapse"><tr>
        ${stat(`${opts.pct}%`, "paid off")}
        ${stat(fmtMoney(opts.paid, opts.currency), "paid so far")}
        ${stat(fmtMoney(opts.totalOwed, opts.currency), "still owed")}
      </tr></table>
    </div>
    <div style="height:8px;background:${BORDER};border-radius:999px;overflow:hidden;margin:14px 0 20px">
      <div style="height:8px;width:${Math.min(100, opts.pct)}%;background:${BRAND};border-radius:999px"></div>
    </div>
    <p style="margin:0 0 20px;color:${MUTED};font-size:14px;line-height:1.6">
      Every payment brings your debt-free date closer. Keep going.
    </p>
    ${button("View your plan", opts.appUrl)}
  `;
  return shell(inner, opts.appUrl);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
