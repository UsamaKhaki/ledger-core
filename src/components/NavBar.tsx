"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubscription } from "@/lib/subscription";
import { track } from "@/lib/analytics";

const links = [
  { href: "/app", label: "Planner", match: (p: string) => p.startsWith("/app") },
  {
    href: "/pricing",
    label: "Pricing",
    match: (p: string) => p.startsWith("/pricing"),
  },
  {
    href: "/settings",
    label: "Settings",
    match: (p: string) => p.startsWith("/settings"),
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="6.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        Ledger
      </span>
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const { isPro } = useSubscription();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/70 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-3.5 sm:px-6 lg:w-4/5">
        <Logo />

        {/* center pill nav */}
        <div className="chip hidden !gap-0 !px-1.5 !py-1.5 md:flex">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {isPro ? (
            <span className="rounded-full border border-[var(--brand)]/40 bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-bold tracking-wide text-[var(--brand)]">
              PRO
            </span>
          ) : (
            <Link
              href="/pricing"
              onClick={() => track("click_upgrade", { source: "navbar" })}
              className="btn-white flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              <span className="text-[var(--brand)]">✦</span> Upgrade
            </Link>
          )}
          {/* compact links for small screens */}
          <Link
            href="/app"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] md:hidden"
          >
            Open
          </Link>
        </div>
      </nav>
    </header>
  );
}
