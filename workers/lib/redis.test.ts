import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { RedisMock } = vi.hoisted(() => ({
  RedisMock: vi.fn(function Redis(this: Record<string, unknown>) {
    this.setMaxListeners = vi.fn();
    this.removeAllListeners = vi.fn();
    this.on = vi.fn();
  }),
}));
vi.mock("ioredis", () => ({ Redis: RedisMock }));

type FakeRedis = {
  setMaxListeners: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};
const globalForRedis = global as unknown as { redis: FakeRedis | undefined };

async function load(env: {
  NODE_ENV: string;
  REDIS_URL?: string;
  REDIS_HOST?: string;
}) {
  vi.resetModules();
  vi.doMock("./env.js", () => ({ env }));
  return (await import("./redis.js")).redisPublisher as unknown as FakeRedis;
}

describe("worker redisPublisher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalForRedis.redis = undefined;
  });
  afterEach(() => {
    globalForRedis.redis = undefined;
    vi.restoreAllMocks();
  });

  it.each([
    [{ REDIS_URL: "redis://cache:6380" }, "redis://cache:6380"],
    [{ REDIS_URL: "", REDIS_HOST: "cache" }, "redis://cache:6379"],
    [{ REDIS_URL: "", REDIS_HOST: "" }, "redis://redis:6379"],
  ])("connects using %j -> %s", async (env, url) => {
    await load({ NODE_ENV: "production", ...env });

    expect(RedisMock).toHaveBeenCalledWith(url, { maxRetriesPerRequest: null });
  });

  it("caches the client on globalThis outside production", async () => {
    const client = await load({
      NODE_ENV: "development",
      REDIS_URL: "redis://x",
    });

    expect(globalForRedis.redis).toBe(client);
  });

  it("does not cache the client in production", async () => {
    await load({ NODE_ENV: "production", REDIS_URL: "redis://x" });

    expect(globalForRedis.redis).toBeUndefined();
  });

  it("reuses a cached client instead of reconnecting", async () => {
    const cached: FakeRedis = {
      setMaxListeners: vi.fn(),
      removeAllListeners: vi.fn(),
      on: vi.fn(),
    };
    globalForRedis.redis = cached;

    const client = await load({
      NODE_ENV: "development",
      REDIS_URL: "redis://x",
    });

    expect(client).toBe(cached);
    expect(RedisMock).not.toHaveBeenCalled();
  });

  it("replaces stale error listeners and logs connection events", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const client = await load({
      NODE_ENV: "production",
      REDIS_URL: "redis://x",
    });
    const handlers = new Map(
      client.on.mock.calls.map(([event, fn]) => [event, fn])
    );

    handlers.get("error")(new Error("ECONNREFUSED"));
    handlers.get("connect")();

    expect(client.setMaxListeners).toHaveBeenCalledWith(0);
    expect(client.removeAllListeners).toHaveBeenCalledWith("error");
    expect(error).toHaveBeenCalledWith("Redis Error:", expect.any(Error));
    expect(log).toHaveBeenCalledWith("✅ Worker Redis client connected.");
  });
});
