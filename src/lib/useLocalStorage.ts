import { useCallback, useRef, useSyncExternalStore } from "react";

// Per-key cache so getSnapshot returns a referentially-stable value while the
// underlying raw string is unchanged (required by useSyncExternalStore to
// avoid infinite render loops).
const cache = new Map<string, { raw: string | null; parsed: unknown }>();

const EVENT = "debtplanner:local-storage";

function notify(key: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/**
 * useState mirrored to localStorage, built on useSyncExternalStore so it is
 * SSR-safe (server renders the initial value, client re-reads after hydration)
 * and stays in sync across tabs. No setState-in-effect.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  // Stabilize the initial value's identity across renders.
  const initialRef = useRef(initial);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = (e: Event) => {
        if (e instanceof CustomEvent && e.detail !== key) return;
        onChange();
      };
      window.addEventListener(EVENT, handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener(EVENT, handler);
        window.removeEventListener("storage", handler);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      // storage unavailable
    }
    const entry = cache.get(key);
    if (entry && entry.raw === raw) return entry.parsed as T;

    let parsed: T = initialRef.current;
    if (raw !== null) {
      try {
        parsed = JSON.parse(raw) as T;
      } catch {
        parsed = initialRef.current;
      }
    }
    cache.set(key, { raw, parsed });
    return parsed;
  }, [key]);

  const getServerSnapshot = useCallback((): T => initialRef.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // `false` on the server / during hydration, `true` once mounted on the client.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const prev = getSnapshot();
      const next =
        typeof updater === "function"
          ? (updater as (p: T) => T)(prev)
          : updater;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // storage full/unavailable — nothing we can do
      }
      notify(key);
    },
    [key, getSnapshot],
  );

  const reset = useCallback(() => setValue(initialRef.current), [setValue]);

  return { value, setValue, hydrated, reset } as const;
}
