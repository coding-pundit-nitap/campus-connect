import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/logger", async () =>
  (await import("@tests/helpers/lib/logger")).silentLoggerModule()
);

/**
 * env.config parses process.env at import time, so each case stubs the env,
 * resets the module registry and imports a fresh copy.
 */
const loadEnv = async () => (await import("./env.config")).env;

describe("env.config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.doUnmock("zod");
  });

  it("parses client and server variables from a valid environment", async () => {
    const env = await loadEnv();

    expect(env.NEXT_PUBLIC_MINIO_BUCKET).toBe("test-bucket");
    expect(env.DATABASE_URL).toBe(process.env.DATABASE_URL);
    expect(env.NODE_ENV).toBe("test");
  });

  it("transforms numeric strings into numbers", async () => {
    vi.stubEnv("PORT", "4000");
    vi.stubEnv("MAX_PAGE_SIZE", "25");

    const env = await loadEnv();

    expect(env.PORT).toBe(4000);
    expect(env.MAX_PAGE_SIZE).toBe(25);
  });

  it.each([
    "SMTP_PORT",
    "MAX_SSE_CONNECTIONS_PER_USER",
    "SSE_CONNECTION_TTL",
    "SSE_HEARTBEAT_INTERVAL",
    "SSE_REPLAY_USER_LIMIT",
    "SSE_REPLAY_BROADCAST_LIMIT",
    "DEFAULT_PAGE_SIZE",
    "MAX_PAGE_SIZE",
    "MAX_FILE_SIZE_MB",
    "PRESIGNED_URL_EXPIRY",
    "MAX_UNREAD_NOTIFICATIONS",
    "DEFAULT_NOTIFICATION_LIMIT",
  ] as const)("parses %s as a base-10 integer", async (key) => {
    vi.stubEnv(key, "042");

    const env = await loadEnv();

    expect(env[key]).toBe(42);
  });

  it("applies defaults when optional variables are missing", async () => {
    vi.stubEnv("DEFAULT_PAGE_SIZE", undefined);
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
    vi.stubEnv("REDIS_HOST", undefined);

    const env = await loadEnv();

    expect(env.DEFAULT_PAGE_SIZE).toBe(10);
    expect(env.NEXT_PUBLIC_API_URL).toBe("/api");
    expect(env.REDIS_HOST).toBe("redis");
  });

  it("throws when a required client variable is invalid", async () => {
    vi.stubEnv("NEXT_PUBLIC_MINIO_ENDPOINT", "");

    await expect(loadEnv()).rejects.toThrow(
      "Invalid client environment variables"
    );
  });

  it.each(["1", "true"])(
    "falls back to raw client values when SKIP_ENV_VALIDATION=%s",
    async (flag) => {
      vi.stubEnv("SKIP_ENV_VALIDATION", flag);
      vi.stubEnv("NEXT_PUBLIC_MINIO_ENDPOINT", "");

      const env = await loadEnv();

      expect(env.NEXT_PUBLIC_MINIO_ENDPOINT).toBe("");
    }
  );

  it("throws when a required server variable is invalid", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");

    await expect(loadEnv()).rejects.toThrow(
      "Invalid server environment variables"
    );
  });

  it.each(["1", "true"])(
    "skips server values when SKIP_ENV_VALIDATION=%s",
    async (flag) => {
      vi.stubEnv("SKIP_ENV_VALIDATION", flag);
      vi.stubEnv("BETTER_AUTH_SECRET", "too-short");

      const env = await loadEnv();

      expect(env.DATABASE_URL).toBeUndefined();
      expect(env.NEXT_PUBLIC_MINIO_BUCKET).toBe("test-bucket");
    }
  );

  it("exposes only client variables in a browser context", async () => {
    vi.stubGlobal("window", {});
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");

    const env = await loadEnv();

    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it.each([
    ["client", "NEXT_PUBLIC_MINIO_ENDPOINT", ""],
    ["server", "BETTER_AUTH_SECRET", "too-short"],
  ])(
    "still reports invalid %s variables on zod builds without treeifyError",
    async (kind, key, value) => {
      vi.doMock("zod", async (importOriginal) => {
        const actual = await importOriginal<typeof import("zod")>();
        return { ...actual, z: { ...actual.z, treeifyError: undefined } };
      });
      vi.stubEnv(key, value);

      await expect(loadEnv()).rejects.toThrow(
        `Invalid ${kind} environment variables`
      );
    }
  );
});
