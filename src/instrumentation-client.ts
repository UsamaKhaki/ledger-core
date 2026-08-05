// Client-side error monitoring via Sentry. Runs before the app becomes
// interactive. Gated on NEXT_PUBLIC_SENTRY_DSN — no DSN, no init, no network.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Session Replay off by default — it can capture sensitive financial data.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    enabled: process.env.NODE_ENV === "production",
  });
}

// Lets Sentry tie errors to client-side navigations. No-op when uninitialized.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
