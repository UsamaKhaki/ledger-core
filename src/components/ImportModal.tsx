"use client";

import { useEffect, useMemo, useState } from "react";
import type { DebtInput } from "@/lib/types";
import { kindMeta } from "@/lib/cards";
import { useMoney } from "@/lib/CurrencyContext";
import { parseCSV, IMPORT_TEMPLATE } from "@/lib/importCsv";

export function ImportModal({
  onClose,
  onImport,
  remainingSlots,
}: {
  onClose: () => void;
  onImport: (inputs: DebtInput[]) => Promise<{ added: number; skipped: number }>;
  remainingSlots: number; // Infinity for Pro
}) {
  const { format } = useMoney();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(
    null,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = useMemo(() => parseCSV(text), [text]);
  const valid = rows.filter((r) => !r.error);
  const invalid = rows.length - valid.length;

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([IMPORT_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function doImport() {
    if (valid.length === 0) return;
    setBusy(true);
    const res = await onImport(valid.map((r) => r.input));
    setBusy(false);
    setResult(res);
  }

  const field =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 placeholder:text-[var(--muted)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5 [box-shadow:var(--shadow)]"
        onClick={(e) => e.stopPropagation()}
      >
        {result ? (
          <div className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success)]/10 text-2xl">
              ✓
            </span>
            <h3 className="font-display text-xl font-semibold tracking-tight">
              Imported {result.added} account{result.added === 1 ? "" : "s"}
            </h3>
            {result.skipped > 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {result.skipped} skipped — the free plan limit was reached.
                Upgrade to Pro for unlimited accounts.
              </p>
            ) : null}
            <button
              onClick={onClose}
              className="btn-white mt-5 w-full px-4 py-2.5 text-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  Import accounts
                </h3>
                <p className="mt-0.5 text-sm text-[var(--muted)]">
                  Paste a CSV or upload a file. Columns are detected
                  automatically.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="shrink-0 rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--border-strong)]"
              >
                ↓ Template
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="cursor-pointer rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition hover:border-[var(--border-strong)]">
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFile}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-[var(--muted)]">or paste below</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={"name, type, issuer, balance, apr, min, limit, due\nSapphire, credit card, Chase, 5200, 22.9, 140, 8000, 15"}
              className={`${field} mt-3 font-mono resize-y`}
            />

            {rows.length > 0 ? (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">
                    {valid.length} ready
                    {invalid > 0 ? ` · ${invalid} skipped` : ""}
                  </span>
                  {Number.isFinite(remainingSlots) ? (
                    <span className="text-[var(--muted)]">
                      {remainingSlots} free slot{remainingSlots === 1 ? "" : "s"} left
                    </span>
                  ) : null}
                </div>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--surface-solid)]">
                      <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 text-right font-medium">Balance</th>
                        <th className="px-3 py-2 text-right font-medium">APR</th>
                        <th className="px-3 py-2 text-right font-medium">Min</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr
                          key={i}
                          className={`border-b border-[var(--border)]/60 last:border-0 ${
                            r.error ? "opacity-50" : ""
                          }`}
                        >
                          <td className="px-3 py-2">
                            <span className="mr-1.5">{kindMeta(r.input.kind).icon}</span>
                            {r.input.name || (
                              <span className="text-[var(--danger)]">{r.error}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[var(--muted)]">
                            {kindMeta(r.input.kind).label}
                          </td>
                          <td className="font-mono-num px-3 py-2 text-right">
                            {r.error ? "—" : format(r.input.balance)}
                          </td>
                          <td className="font-mono-num px-3 py-2 text-right">
                            {r.input.apr}%
                          </td>
                          <td className="font-mono-num px-3 py-2 text-right">
                            {format(r.input.minPayment)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--elevate)]"
              >
                Cancel
              </button>
              <button
                onClick={doImport}
                disabled={valid.length === 0 || busy}
                className="btn-white px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {busy
                  ? "Importing…"
                  : `Import ${valid.length || ""} account${valid.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
