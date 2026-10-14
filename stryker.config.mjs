// Mutation testing: plants small bugs ("mutants") in the critical business
// modules and reports any the unit tests fail to catch. Run: pnpm test:mutation
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  // Explicit: pnpm's strict node_modules hides plugins from auto-discovery.
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.stryker.config.ts", related: true },
  coverageAnalysis: "perTest",
  mutate: [
    // Money, ordering and batch lifecycle
    "src/services/order/order.service.ts",
    "src/services/cart/cart.service.ts",
    "src/services/batch/batch.service.ts",
    "src/repositories/order.repository.ts",
    "src/repositories/batch.repository.ts",
    "src/repositories/cart.repository.ts",
    "src/actions/orders/*.ts",
    "src/actions/shop/order-management-actions.ts",
    "src/actions/admin/order-actions.ts",
    "src/lib/utils/order.utils.ts",
    "src/lib/utils/cart.utils.ts",
    "src/lib/utils/earnings.ts",
    "src/validations/order.validation.ts",
    "workers/services/batch.service.ts",
    // Access control
    "src/rbac.ts",
    "src/proxy.ts",
    "src/lib/verify-admin.ts",
    "src/lib/utils/auth.utils.server.ts",
    "src/actions/_shared/action-helpers.ts",
    "src/actions/admin/_shared.ts",
    // Pagination
    "src/lib/paginate.ts",
    "src/repositories/cursor-page.ts",
    // Never mutate the tests themselves.
    "!**/*.test.ts",
  ],
  ignorePatterns: ["coverage", "dist", ".next", "src/actions/admin/__dbg"],
  reporters: ["html", "clear-text", "progress", "json"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  thresholds: { high: 90, low: 80, break: null },
  concurrency: 6,
  timeoutMS: 20000,
  tempDirName: ".stryker-tmp",
};
