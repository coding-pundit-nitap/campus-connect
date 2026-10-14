import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * Unit-only config for mutation testing (Stryker). Integration tests are
 * excluded: they share Postgres worker DBs and are too slow to run per mutant.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "workers/**/*.test.ts"],
    exclude: ["**/node_modules/**", "src/actions/admin/__dbg/**"],
    setupFiles: ["./tests/setup/unit-setup.ts"],
  },
});
