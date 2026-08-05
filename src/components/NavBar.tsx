"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubscription } from "@/lib/subscription";
import { useTheme } from "@/lib/theme";
import { track } from "@/lib/analytics";
import { AccountMenu } from "./AccountMenu";

function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--elevate)] hover:text-[var(--foreground)]"
    >
      {mode === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2v2.4M12 19.6V22M22 12h-2.4M4.4 12H2M19 5l-1.7 1.7M6.7 17.3 5 19M19 19l-1.7-1.7M6.7 6.7 5 5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}

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
    <Link href="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 28 28" className="h-6 w-6" aria-hidden>
        <defs>
          <linearGradient id="navMark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <g transform="rotate(-18 14 14)">
          <ellipse
            cx="14"
            cy="14"
            rx="12.5"
            ry="5.6"
            fill="none"
            stroke="url(#navMark)"
            strokeWidth="1.6"
            opacity="0.9"
          />
        </g>
        <circle cx="14" cy="14" r="3.4" fill="url(#navMark)" />
      </svg>
      <span className="font-display text-[17px] font-semibold tracking-tight">
        Ledger
      </span>
    </Link>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const { isPro } = useSubscription();
  const barRef = useRef<HTMLDivElement>(null);

  // Inside the app (dashboard/settings), keep the nav minimal — the account
  // menu handles navigation. The full marketing menu only shows on public pages.
  const isAppArea =
    pathname.startsWith("/app") || pathname.startsWith("/settings");

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div ref={barRef} className="site-nav">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-8 px-4 sm:px-6 lg:w-4/5">
          <Logo />

          {/* primary nav — full marketing menu on public pages only */}
          {!isAppArea ? (
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => {
                const active = l.match(pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--elevate)] text-[var(--foreground)]"
                        : "text-[var(--muted)] hover:bg-[var(--elevate)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {/* actions */}
          <div className="ml-auto flex items-center gap-2.5">
            {!isAppArea && !isPro ? (
              <Link
                href="/pricing"
                onClick={() => track("click_upgrade", { source: "navbar" })}
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)] sm:block"
              >
                Upgrade
              </Link>
            ) : null}
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
