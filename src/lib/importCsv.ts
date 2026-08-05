// Pure CSV → DebtInput parsing for the import flow. No React/DOM here so it can
// be unit-tested and reused. Detects a header row (mapping columns by alias) or
// falls back to a fixed column order.

import type { DebtInput, DebtKind } from "./types";
import { DEBT_KINDS } from "./cards";

const FIELD_ALIASES: Record<string, keyof DebtInput> = {
  name: "name", account: "name", card: "name", debt: "name", label: "name",
  type: "kind", kind: "kind", category: "kind",
  issuer: "issuer", bank: "issuer", lender: "issuer", provider: "issuer",
  balance: "balance", amount: "balance", owed: "balance", "current balance": "balance",
  apr: "apr", rate: "apr", interest: "apr", "interest rate": "apr",
  min: "minPayment", minimum: "minPayment", "min payment": "minPayment",
  minpayment: "minPayment", "minimum payment": "minPayment", "min / mo": "minPayment",
  limit: "creditLimit", "credit limit": "creditLimit", creditlimit: "creditLimit",
  due: "dueDay", "due day": "dueDay", dueday: "dueDay", "due date": "dueDay",
};

const DEFAULT_ORDER: (keyof DebtInput)[] = [
  "name", "balance", "apr", "minPayment", "kind", "issuer", "creditLimit", "dueDay",
];

export type ParsedRow = { input: DebtInput; error?: string };

/** Split one CSV line, respecting double-quoted fields. */
export function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function toNumber(s: string): number | null {
  const cleaned = s.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toKind(s: string): DebtKind {
  const v = s.trim().toLowerCase();
  const exact = DEBT_KINDS.find((k) => k.value === v || k.label.toLowerCase() === v);
  if (exact) return exact.value;
  if (/store/.test(v)) return "store_card";
  if (/credit|visa|master|amex/.test(v)) return "credit_card";
  if (/car|auto|vehicle/.test(v)) return "auto_loan";
  if (/student|tuition/.test(v)) return "student_loan";
  if (/mortgage|home|house/.test(v)) return "mortgage";
  if (/medical|hospital|health/.test(v)) return "medical";
  if (/bnpl|installment|tabby|tamara|klarna|afterpay/.test(v)) return "bnpl";
  if (/loan|personal|finance/.test(v)) return "personal_loan";
  return "other";
}

function looksLikeHeader(cells: string[]): boolean {
  return cells.some((c) => FIELD_ALIASES[c.toLowerCase()] !== undefined);
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const first = splitLine(lines[0]);
  const hasHeader = looksLikeHeader(first);
  const columns: (keyof DebtInput | null)[] = hasHeader
    ? first.map((c) => FIELD_ALIASES[c.toLowerCase()] ?? null)
    : DEFAULT_ORDER;

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cells = splitLine(line);
    const rec: Partial<Record<keyof DebtInput, string>> = {};
    cells.forEach((cell, i) => {
      const key = columns[i];
      if (key) rec[key] = cell;
    });

    const name = (rec.name ?? "").trim();
    const balance = toNumber(rec.balance ?? "");
    const apr = toNumber(rec.apr ?? "") ?? 0;
    const minPayment = toNumber(rec.minPayment ?? "") ?? 0;
    const creditLimit = rec.creditLimit ? toNumber(rec.creditLimit) : null;
    const dueRaw = rec.dueDay ? toNumber(rec.dueDay) : null;
    const dueDay =
      dueRaw != null && dueRaw >= 1 && dueRaw <= 31 ? Math.round(dueRaw) : null;

    const input: DebtInput = {
      name,
      kind: toKind(rec.kind ?? ""),
      issuer: (rec.issuer ?? "").trim() || null,
      balance: balance ?? 0,
      apr: Math.max(0, apr),
      minPayment: Math.max(0, minPayment),
      creditLimit: creditLimit && creditLimit > 0 ? creditLimit : null,
      dueDay,
    };

    let error: string | undefined;
    if (!name) error = "Missing name";
    else if (balance == null || balance <= 0) error = "Invalid balance";

    return { input, error };
  });
}

export const IMPORT_TEMPLATE =
  "name,type,issuer,balance,apr,min payment,credit limit,due day\n" +
  "Sapphire,credit card,Chase,5200,22.9,140,8000,15\n" +
  "Car loan,auto loan,Toyota,12000,6.5,320,,1\n";
