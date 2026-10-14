import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FakeRedis = {
  url?: string;
  options?: object;
  handlers: Record<string, (arg?: unknown) => void>;
  setMaxListeners: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  duplicate: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => {
  const make = (url?: string, options?: object): FakeRedis => {
    const r: FakeRedis = {
      url,
      options,
      handlers: {},
      setMaxListeners: vi.fn(),
      removeAllListeners: vi.fn(),
      on: vi.fn((event: string, fn: (arg?: unknown) => void) => {
        r.handlers[event] = fn;
      }),
      duplicate: vi.fn(() => make(url, options)),
    };
    return r;
  };
  return {
    env: {} as Record<string, unknown>,
    make,
    Redis: vi.fn(function (url: string, options: object) {
      return make(url, options);
    }),
  };
});

vi.mock("@/config/env.config", () => ({ env: mocks.env }));
vi.mock("ioredis", () => ({ default: mocks.Redis }));

type GlobalSlots = { redis?: unknown; redisSubscriber?: unknown };
const slots = global as unknown as GlobalSlots;

const load = async () => import("./redis");

describe("redis clients", () => {
  let saved: GlobalSlots;

  beforeEach(() => {
    vi.resetModules();
    mocks.Redis.mockClear();
    saved = { redis: slots.redis, redisSubscriber: slots.redisSubscriber };
    delete slots.redis;
    delete slots.redisSubscriber;
    delete mocks.env.REDIS_URL;
  });

  afterEach(() => {
    slots.redis = saved.redis;
    slots.redisSubscriber = saved.redisSubscriber;
  });

  it("connects to REDIS_URL with unlimited retries per request", async () => {
    mocks.env.REDIS_URL = "redis://cache:6390";

    await load();

    expect(mocks.Redis).toHaveBeenCalledWith("redis://cache:6390", {
      maxRetriesPerRequest: null,
    });
  });

  it("defaults to the docker redis host", async () => {
    await load();

    expect(mocks.Redis).toHaveBeenCalledWith(
      "redis://redis:6379",
      expect.anything()
    );
  });

  it("exposes a publisher, an SSE alias and a duplicated subscriber", async () => {
    const mod = await load();
    const publisher = mod.redisPublisher as unknown as FakeRedis;

    expect(mod.redisSSE).toBe(mod.redisPublisher);
    expect(publisher.duplicate).toHaveBeenCalledTimes(1);
    expect(mod.redisSubscriber).toBe(publisher.duplicate.mock.results[0].value);
  });

  it("stores both clients on global for reuse", async () => {
    const mod = await load();

    expect(slots.redis).toBe(mod.redisPublisher);
    expect(slots.redisSubscriber).toBe(mod.redisSubscriber);
  });

  it("reuses clients already stored on global", async () => {
    const existing = mocks.make();
    const existingSub = mocks.make();
    slots.redis = existing;
    slots.redisSubscriber = existingSub;

    const mod = await load();

    expect(mocks.Redis).not.toHaveBeenCalled();
    expect(mod.redisPublisher).toBe(existing);
    expect(mod.redisSubscriber).toBe(existingSub);
  });

  it("replaces stale listeners and installs fresh ones", async () => {
    const mod = await load();
    const publisher = mod.redisPublisher as unknown as FakeRedis;
    const subscriber = mod.redisSubscriber as unknown as FakeRedis;

    expect(publisher.setMaxListeners).toHaveBeenCalledWith(0);
    expect(subscriber.setMaxListeners).toHaveBeenCalledWith(0);
    expect(publisher.removeAllListeners.mock.calls.flat()).toEqual([
      "error",
      "connect",
      "close",
      "ready",
    ]);
    expect(subscriber.removeAllListeners.mock.calls.flat()).toEqual([
      "error",
      "close",
      "ready",
    ]);
    expect(Object.keys(publisher.handlers).sort()).toEqual([
      "connect",
      "error",
    ]);
    expect(Object.keys(subscriber.handlers)).toEqual(["error"]);
  });

  it("swallows connection events without throwing", async () => {
    const mod = await load();
    const publisher = mod.redisPublisher as unknown as FakeRedis;
    const subscriber = mod.redisSubscriber as unknown as FakeRedis;

    expect(() => {
      publisher.handlers.error(new Error("ECONNREFUSED"));
      publisher.handlers.connect();
      subscriber.handlers.error(new Error("ECONNREFUSED"));
    }).not.toThrow();
  });
});
