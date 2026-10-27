import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Baseline security headers.
//
// The CSP deliberately omits `default-src`: it is the fallback for `script-src`
// and `style-src`, and this app ships an inline theme bootstrap plus Next's own
// inline runtime and React inline styles — `default-src 'self'` blocks all of
// them and the page renders unstyled and dead. Locking scripts down properly
// needs per-request nonces (a proxy change), so until then we ship only the
// directives that have no such fallback behaviour. `frame-ancestors` is the one
// that matters most for a money app (clickjacking); X-Frame-Options is its
// pre-CSP equivalent for older browsers.
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Nothing in the app uses these; deny them outright.
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    // Ignored over plain HTTP, so it's a no-op locally and enforced in prod.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next doesn't pick up a stray
  // lockfile in a parent directory.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // Authenticated surfaces and the API must never be cached by a shared
        // proxy — one user's debts must not be served to the next.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

// Wrap with Sentry. Runtime error capture is driven by NEXT_PUBLIC_SENTRY_DSN
// (see instrumentation*.ts). Source-map upload only runs when SENTRY_AUTH_TOKEN
// + org/project are set, so builds work fine without any Sentry credentials.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
