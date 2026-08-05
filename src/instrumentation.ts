// Server + edge error monitoring via Sentry. Everything is gated on
// NEXT_PUBLIC_SENTRY_DSN — with no DSN set, register() no-ops and nothing is
// sent, so the app runs exactly as before until you wire up a Sentry project.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (!dsn) return;

  const options: Sentry.NodeOptions = {
    dsn,
    environment: process.env.NODE_ENV,
    // Sample a slice of traces in prod; everything in dev for easy testing.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Don't leak local noise into your Sentry project during development.
    enabled: process.env.NODE_ENV === "production",
  };

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(options);
  } else if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(options);
  }
}

// Captures errors thrown while handling a request (Route Handlers, Server
// Components, etc.). No-op when Sentry isn't initialized.
export const onRequestError = Sentry.captureRequestError;
