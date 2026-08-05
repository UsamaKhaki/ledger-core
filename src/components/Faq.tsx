"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "Is Ledger really free?",
    a: "Yes. The core planner — avalanche & snowball strategies, your debt-free date, the payoff chart, payment tracking, and up to 3 debts — is free forever, no card required. Ledger Pro unlocks unlimited debts, the full amortization schedule, and CSV export.",
  },
  {
    q: "Do you connect to my bank?",
    a: "No. You enter your debts manually — there's no bank linking and no screen-scraping. You stay in control of exactly what Ledger knows.",
  },
  {
    q: "Where is my data stored?",
    a: "In a secure database, isolated per account so only you can see your debts and payments. We never sell or share it, and you can export or permanently delete everything from Settings at any time.",
  },
  {
    q: "What's the difference between avalanche and snowball?",
    a: "Avalanche attacks your highest-interest debt first, which saves the most money. Snowball clears your smallest balance first for a quick, motivating win. Ledger shows both so you can decide with your eyes open.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Absolutely. Downgrade whenever you like from Settings — your data stays intact on the free plan.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-[var(--border)]">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="py-1">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-display text-base font-semibold">
                {item.q}
              </span>
              <span
                className={`shrink-0 text-[var(--brand)] transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-4 text-sm leading-relaxed text-[var(--muted)]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
