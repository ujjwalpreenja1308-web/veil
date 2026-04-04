// Vitest config for E2E integration tests.
// These tests require a running server and real Supabase credentials.
//
// Prerequisites:
//   1. Copy .env.example to .env.test.local and fill in real values
//   2. Start the dev server: npm run dev
//   3. Run: npm run test:e2e
//
// To test against a deployed preview, set TEST_BASE_URL:
//   TEST_BASE_URL=https://your-preview.vercel.app npm run test:e2e

import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    globals: true,
    include: ["e2e/**/*.spec.ts"],
    // Load .env.test.local for real credentials (never committed)
    env: loadEnv(mode, process.cwd(), ""),
    // E2E tests are slower — give each test file 60s
    testTimeout: 60_000,
    // Run test files sequentially to avoid rate limit interference between suites
    pool: "forks",
    singleFork: true,
    // No coverage for e2e — they're integration tests, not unit tests
    coverage: { enabled: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
}));
