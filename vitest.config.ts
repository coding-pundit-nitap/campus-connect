import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { TEST_WORKERS } from "./tests/setup/worker-count";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
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
          pool: "forks",
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
      thresholds: {
        "src/rbac.ts": {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        "src/services/order/order.service.ts": {
          statements: 75,
          branches: 78,
          functions: 82,
          lines: 75,
        },
        "src/services/cart/cart.service.ts": {
          statements: 95,
          branches: 80,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
});
