"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Catches errors thrown while rendering the root layout/app. Reports to Sentry
// (no-op when uninitialized) and shows a minimal recovery screen. Must render
// its own <html>/<body> because it replaces the root layout.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0b0b0f",
          color: "#e7e7ea",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#a1a1aa",
              margin: "0 0 20px",
            }}
          >
            An unexpected error interrupted the app. It&apos;s been logged, and
            you can try again.
          </p>
          <button
            onClick={reset}
            style={{
              border: "1px solid #35353c",
              background: "#e7e7ea",
              color: "#0b0b0f",
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
