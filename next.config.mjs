import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps during build (requires SENTRY_AUTH_TOKEN)
  silent: !process.env.CI,

  // Automatically tree-shake Sentry debug code in production
  disableLogger: true,

  // Tunnel Sentry requests through your own domain to avoid ad-blockers
  tunnelRoute: "/monitoring-tunnel",

  // Hide source maps from the browser bundle
  hideSourceMaps: true,
});
