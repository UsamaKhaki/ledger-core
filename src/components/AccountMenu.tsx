"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { useSubscription } from "@/lib/subscription";

type Pos = { top: number; right: number };

export function AccountMenu() {
  const { user, logout } = useAuth();
  const { isPro } = useSubscription();
  const [pos, setPos] = useState<Pos | null>(null);
  const open = pos !== null;

  // close on escape, scroll, or resize (position would otherwise go stale)
  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
      >
        Log in
      </Link>
    );
  }

  const initial = (user.name || user.email).charAt(0).toUpperCase();
  const item =
    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--elevate)] hover:text-[var(--foreground)]";

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (open) {
      setPos(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  }

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            {/* backdrop catches outside clicks; sits above the whole app.
                position/z-index are inline so they beat the unlayered
                `body > *` rule in globals.css (which would otherwise force
                these portal children into normal flow at z-index 1). */}
            <div
              style={{ position: "fixed", inset: 0, zIndex: 100 }}
              onClick={() => setPos(null)}
              aria-hidden
            />
            <div
              role="menu"
              style={{
                position: "fixed",
                top: pos.top,
                right: pos.right,
                zIndex: 101,
              }}
              className="animate-[pop_0.14s_ease-out] w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-1.5 [box-shadow:var(--shadow)]"
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#818cf8] to-[#34d399] text-sm font-bold text-[#06070d]">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user.name || "Your account"}
                    {isPro ? (
                      <span className="ml-1.5 text-[10px] font-bold tracking-wide text-[var(--brand)]">
                        PRO
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="my-1 h-px bg-[var(--border)]" />

              <Link
                href="/app"
                role="menuitem"
                className={item}
                onClick={() => setPos(null)}
              >
                <span className="text-[var(--muted)]">▤</span> Planner
              </Link>
              <Link
                href="/settings"
                role="menuitem"
                className={item}
                onClick={() => setPos(null)}
              >
                <span className="text-[var(--muted)]">⚙</span> Settings
              </Link>
              {!isPro ? (
                <Link
                  href="/pricing"
                  role="menuitem"
                  className={item}
                  onClick={() => setPos(null)}
                >
                  <span className="text-[var(--brand)]">✦</span> Upgrade to Pro
                </Link>
              ) : null}

              <div className="my-1 h-px bg-[var(--border)]" />

              <button
                role="menuitem"
                onClick={() => {
                  setPos(null);
                  void logout();
                }}
                className={`${item} w-full hover:!text-[var(--danger)]`}
              >
                <span>⏻</span> Log out
              </button>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#818cf8] to-[#34d399] text-sm font-bold text-[#06070d] ring-1 transition ${
          open
            ? "ring-2 ring-[var(--brand)]"
            : "ring-[var(--border)] hover:ring-[var(--border-strong)]"
        }`}
      >
        {initial}
      </button>
      {menu}
    </>
  );
}
