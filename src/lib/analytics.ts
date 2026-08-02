/**
 * Lightweight analytics shim. Swap the body of `track` for a real provider
 * (PostHog, Vercel Analytics, GA4, Segment) when you wire billing/accounts.
 * Kept provider-agnostic so product events are instrumented from day one.
 */
export type AnalyticsEvent =
  | "view_landing"
  | "view_pricing"
  | "start_free"
  | "add_debt"
  | "hit_paywall"
  | "click_upgrade"
  | "checkout_started"
  | "upgraded"
  | "downgraded"
  | "export_csv";

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // TODO: forward to your analytics provider, e.g.
  //   posthog.capture(event, props)
  //   window.va?.("event", { name: event, ...props })
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics] ${event}`, props ?? {});
  }
}
