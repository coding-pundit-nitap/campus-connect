import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env: { REDIS_URL?: string; REDIS_HOST?: string }) {
  vi.resetModules();
  vi.doMock("./env.js", () => ({ env }));
  return (await import("./redis-connection.js")).redisConnection;
}

describe("worker redisConnection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses host and port from REDIS_URL", async () => {
    await expect(
      load({ REDIS_URL: "redis://cache.local:6380" })
    ).resolves.toEqual({
      host: "cache.local",
      port: 6380,
      maxRetriesPerRequest: null,
    });
  });

  it("defaults the port to 6379 when REDIS_URL has none", async () => {
    await expect(load({ REDIS_URL: "redis://cache.local" })).resolves.toEqual({
      host: "cache.local",
      port: 6379,
      maxRetriesPerRequest: null,
    });
  });

  it("falls back to REDIS_HOST when REDIS_URL is invalid", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      load({ REDIS_URL: "not a url", REDIS_HOST: "redis-host" })
    ).resolves.toEqual({
      host: "redis-host",
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(error).toHaveBeenCalledWith(
      "Invalid REDIS_URL, falling back to defaults",
      expect.any(TypeError)
    );
  });

  it.each([
    ["REDIS_HOST", { REDIS_URL: "", REDIS_HOST: "redis-host" }, "redis-host"],
    ["the default host", { REDIS_URL: "", REDIS_HOST: "" }, "redis"],
  ])("uses %s when REDIS_URL is empty", async (_label, env, host) => {
    await expect(load(env)).resolves.toEqual({
      host,
      port: 6379,
      maxRetriesPerRequest: null,
    });
  });
});
