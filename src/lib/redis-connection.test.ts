import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ env: {} as Record<string, unknown> }));

vi.mock("@/config/env.config", () => ({ env: mocks.env }));

const load = async () => (await import("./redis-connection")).redisConnection;

const DEFAULTS = { host: "redis", port: 6379, maxRetriesPerRequest: null };

describe("redisConnection", () => {
  beforeEach(() => {
    vi.resetModules();
    delete mocks.env.REDIS_URL;
  });

  it.each([
    ["redis://cache.internal:6380", { host: "cache.internal", port: 6380 }],
    ["redis://cache.internal", { host: "cache.internal", port: 6379 }],
  ])("parses %s", async (url, expected) => {
    mocks.env.REDIS_URL = url;

    await expect(load()).resolves.toEqual({
      ...expected,
      maxRetriesPerRequest: null,
    });
  });

  it("falls back to defaults for a malformed URL", async () => {
    mocks.env.REDIS_URL = "not a url";

    await expect(load()).resolves.toEqual(DEFAULTS);
  });

  it("uses defaults when REDIS_URL is unset", async () => {
    await expect(load()).resolves.toEqual(DEFAULTS);
  });
});
