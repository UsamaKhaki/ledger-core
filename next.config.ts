import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next doesn't pick up a stray
  // lockfile in a parent directory.
  turbopack: {
    root: __dirname,
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
