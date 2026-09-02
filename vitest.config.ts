import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { TEST_WORKERS } from "./tests/setup/worker-count";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    maxWorkers: TEST_WORKERS,
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
      exclude: [
        "**/generated/**",
        "**/*.d.ts",

        // Type-only / barrel files
        "src/types/**",
        "src/**/index.ts",

        // Tests and test infrastructure
        "tests/**",
      ],

      thresholds: {
        statements: 45,
        branches: 35,
        functions: 40,
        lines: 60,
        "src/rbac.ts": {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        "src/services/order/order.service.ts": {
          statements: 75,
          branches: 75,
          functions: 82,
          lines: 75,
        },
        "src/services/cart/cart.service.ts": {
          statements: 95,
          branches: 75,
          functions: 95,
          lines: 95,
        },
        "src/services/product/product.service.ts": {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
        },
        "src/repositories/order.repository.ts": {
          statements: 90,
          branches: 65,
          functions: 90,
          lines: 90,
        },
        "src/repositories/product.repository.ts": {
          statements: 95,
          branches: 80,
          functions: 95,
          lines: 95,
        },
        "src/repositories/user.repository.ts": {
          statements: 95,
          branches: 80,
          functions: 95,
          lines: 95,
        },
        "src/services/file-upload/file-upload.service.ts": {
          statements: 90,
          branches: 90,
          functions: 95,
          lines: 90,
        },
      },
    },
  },
});
