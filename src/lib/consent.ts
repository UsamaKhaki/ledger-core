// Cookie consent state. Stored under the same localStorage convention as
// useLocalStorage (JSON-encoded), so a plain read must JSON.parse it.

export const CONSENT_KEY = "debtplanner.consent";
export type Consent = "accepted" | "rejected" | null;

/** Non-essential analytics may only run when the user has explicitly accepted. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) === "accepted" : false;
  } catch {
    return false;
  }
}
