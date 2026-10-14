import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { TEST_WORKERS } from "./tests/setup/worker-count";

/**
 * Coverage scope = the logic layers. Presentational UI (components,
 * page-components, app pages/layouts, client hooks) is intentionally out of
 * scope for the coverage gate.
 */
const COVERAGE_INCLUDE = [
  "src/actions/**/*.ts",
  "src/services/**/*.ts",
  "src/repositories/**/*.ts",
  "src/lib/**/*.ts",
  "src/validations/**/*.ts",
  "src/di/**/*.ts",
  "src/config/**/*.ts",
  "src/app/api/**/*.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/rbac.ts",
  "src/proxy.ts",
  "src/auth.ts",
  "workers/**/*.ts",
];

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
          include: ["src/**/*.test.ts", "workers/**/*.test.ts"],
          setupFiles: ["./tests/setup/unit-setup.ts"],
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
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: COVERAGE_INCLUDE,
      exclude: [
        "**/generated/**",
        "**/*.d.ts",
        "**/*.test.ts",
        // Type-only / barrel files
        "src/types/**",
        "**/index.ts",
        "workers/**/types.ts",
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
