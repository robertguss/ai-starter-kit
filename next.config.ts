import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

const canUploadSourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT,
);

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: { disable: !canUploadSourceMaps },
  telemetry: false,
  webpack: { treeshake: { removeDebugLogging: true } },
});
