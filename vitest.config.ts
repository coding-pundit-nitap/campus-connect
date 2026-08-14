import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { TEST_WORKERS } from "./tests/setup/worker-count";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Vitest's ProjectConfig type deliberately omits maxWorkers/minWorkers —
    // they are root-only options (see NonProjectOptions in vitest's config
    // types). Setting them inside the integration project's `test` block
    // below is silently ignored: with 5+ integration test files, forks were
    // observed spawning up to VITEST_POOL_ID=5 even with maxWorkers/minWorkers
    // set to 4 there, causing "database cc_test_w5 does not exist". Pinning
    // them here at the root is what actually caps the fork pool. This also
    // bounds the unit project's pool, which is harmless (104 unit tests run
    // in ~1s regardless of worker count).
    maxWorkers: TEST_WORKERS,
    minWorkers: TEST_WORKERS,
    projects: [
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["./tests/setup/global-setup.ts"],
          setupFiles: ["./tests/setup/integration-setup.ts"],
          // forks, not threads: threads share process.env and would collapse
          // every worker onto one database.
          pool: "forks",
          // Worker count is pinned at the root (maxWorkers/minWorkers above),
          // not here — ProjectConfig omits these fields, so setting them on
          // a project is a silent no-op in this vitest version.
          // Share the module registry across files in a worker so the Prisma
          // client and its pool are created once per worker, not once per file.
          isolate: false,
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
