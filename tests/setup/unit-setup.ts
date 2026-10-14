import { config as loadEnv } from "dotenv";
import { vi } from "vitest";

// Deterministic env for every unit test, independent of the dev's .env.
loadEnv({ path: ".env.test", override: true, quiet: true });
process.env.LOG_LEVEL = "silent";

vi.mock("next/headers", async () => (await import("../helpers")).nextHeaders());
vi.mock("next/navigation", async () =>
  (await import("../helpers")).nextNavigation()
);
vi.mock("next/cache", async () => (await import("../helpers")).nextCache());
