// Pure request-body validation. No server imports on purpose: the contract's
// `c.type<T>()` is compile-time only, so these functions are the real boundary
// between a hostile payload and the database — and they must be unit-testable
// without pulling in Supabase, cookies, or Stripe.

import { DEBT_KINDS } from "@/lib/cards";
import type { DebtInput, DebtKind } from "@/lib/types";

// ── field limits ─────────────────────────────────────────────────────────────
// Generous enough for any real debt, tight enough to keep junk out of the DB
// and the payoff engine (a nonsense APR makes the simulation run to its cap).
const MAX_NAME = 120;
const MAX_ISSUER = 80;
const MAX_MONEY = 1_000_000_000; // $1B
const MAX_APR = 200; // %

const KINDS = new Set<string>(DEBT_KINDS.map((k) => k.value));

function money(v: unknown, field: string, required: boolean): number | string {
  if (v == null) {
    if (required) return `${field} is required.`;
    return 0;
  }
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return `${field} must be a number.`;
  if (n < 0) return `${field} can't be negative.`;
  if (n > MAX_MONEY) return `${field} is unrealistically large.`;
  return n;
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Validate a debt payload. `partial` allows the PATCH shape, where any subset
 * of fields may be present and absent ones are left untouched.
 */
export function validateDebtInput(
  body: unknown,
  { partial }: { partial: boolean },
): Validated<Partial<DebtInput>> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const out: Partial<DebtInput> = {};

  const has = (k: string) => b[k] !== undefined;

  if (has("name") || !partial) {
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (!name) return { ok: false, error: "Give this debt a name." };
    if (name.length > MAX_NAME) {
      return { ok: false, error: `Name must be under ${MAX_NAME} characters.` };
    }
    out.name = name;
  }

  if (has("issuer")) {
    if (b.issuer === null) out.issuer = null;
    else {
      const issuer = typeof b.issuer === "string" ? b.issuer.trim() : "";
      if (issuer.length > MAX_ISSUER) {
        return { ok: false, error: `Issuer must be under ${MAX_ISSUER} characters.` };
      }
      out.issuer = issuer || null;
    }
  }

  if (has("kind") || !partial) {
    const kind = typeof b.kind === "string" ? b.kind : "";
    if (!KINDS.has(kind)) return { ok: false, error: "Unknown debt type." };
    out.kind = kind as DebtKind;
  }

  if (has("balance") || !partial) {
    const v = money(b.balance, "Balance", true);
    if (typeof v === "string") return { ok: false, error: v };
    if (!partial && !(v > 0)) {
      return { ok: false, error: "Balance must be greater than 0." };
    }
    out.balance = v;
  }

  if (has("apr") || !partial) {
    const n = typeof b.apr === "number" ? b.apr : Number(b.apr ?? 0);
    if (!Number.isFinite(n) || n < 0 || n > MAX_APR) {
      return { ok: false, error: `APR must be between 0 and ${MAX_APR}%.` };
    }
    out.apr = n;
  }

  if (has("minPayment") || !partial) {
    const v = money(b.minPayment, "Minimum payment", false);
    if (typeof v === "string") return { ok: false, error: v };
    out.minPayment = v;
  }

  if (has("creditLimit")) {
    if (b.creditLimit === null) out.creditLimit = null;
    else {
      const v = money(b.creditLimit, "Credit limit", false);
      if (typeof v === "string") return { ok: false, error: v };
      out.creditLimit = v > 0 ? v : null;
    }
  }

  if (has("dueDay")) {
    if (b.dueDay === null) out.dueDay = null;
    else {
      const n = Number(b.dueDay);
      if (!Number.isInteger(n) || n < 1 || n > 31) {
        return { ok: false, error: "Due day must be a day of the month (1–31)." };
      }
      out.dueDay = n;
    }
  }

  return { ok: true, value: out };
}

/** Validate a payment payload. */
export function validatePayment(
  body: unknown,
): Validated<{ debtId: string; amount: number }> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;
  const debtId = typeof b.debtId === "string" ? b.debtId.trim() : "";
  if (!debtId) return { ok: false, error: "Which debt is this payment for?" };
  const amount = typeof b.amount === "number" ? b.amount : Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than 0." };
  }
  if (amount > MAX_MONEY) {
    return { ok: false, error: "Amount is unrealistically large." };
  }
  return { ok: true, value: { debtId, amount } };
}
