"use client";

import { useEffect, useState } from "react";

/**
 * Current timestamp, resolved after mount (via rAF so we never call `Date.now()`
 * during render — keeps components pure/lint-clean). Returns null until ready.
 */
export function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(id);
  }, []);
  return now;
}
