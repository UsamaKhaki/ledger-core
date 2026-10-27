"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog shell: backdrop, Escape-to-close, and the accessibility
 * behaviour every modal needs and none of them had —
 *
 *  - `role="dialog"` + `aria-modal` so assistive tech announces it as a dialog
 *    and doesn't read the page behind it,
 *  - `aria-labelledby` pointing at the title, so it is announced by name,
 *  - a focus trap, so Tab can't wander into the page underneath,
 *  - focus restored to whatever opened the dialog on close.
 *
 * Render the title with the `titleId` this passes to `children`.
 */
export function Modal({
  onClose,
  children,
  panelClassName = "w-full max-w-md",
  labelledBy,
}: {
  onClose: () => void;
  children: (ids: { titleId: string }) => ReactNode;
  /** Sizing/appearance for the panel itself. */
  panelClassName?: string;
  /** Override when the title lives outside `children`. */
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = labelledBy ?? `${generatedId}-title`;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Move focus into the dialog if nothing inside claimed it (autoFocus).
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    // Stop the page behind the dialog from scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${panelClassName} rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] outline-none [box-shadow:var(--shadow)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {children({ titleId })}
      </div>
    </div>
  );
}
