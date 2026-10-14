import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Callback = (err?: Error | null) => void;

const mocks = vi.hoisted(() => {
  const listeners: Record<string, (channel: string, msg: string) => void> = {};
  return {
    listeners,
    subscriber: {
      on: vi.fn((event: string, fn: (c: string, m: string) => void) => {
        listeners[event] = fn;
      }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    },
  };
});

vi.mock("@/lib/logger", async () =>
  (await import("@tests/helpers/lib/logger")).silentLoggerModule()
);
vi.mock("./redis", () => ({ redisSubscriber: mocks.subscriber }));

const slots = global as unknown as { notificationEmitter?: unknown };

const load = async () => (await import("./notification-emitter")).default;

describe("notificationEmitter", () => {
  let saved: unknown;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    saved = slots.notificationEmitter;
    delete slots.notificationEmitter;
  });

  afterEach(() => {
    slots.notificationEmitter = saved;
  });

  it("re-emits Redis messages on the matching channel", async () => {
    const emitter = await load();
    const handler = vi.fn();
    emitter.on("user:1", handler);

    mocks.listeners.message("user:1", "payload");

    expect(handler).toHaveBeenCalledWith("payload");
  });

  it("subscribes to Redis only for the first local listener", async () => {
    const emitter = await load();

    emitter.subscribe("user:1", vi.fn());
    emitter.subscribe("user:1", vi.fn());

    expect(mocks.subscriber.subscribe).toHaveBeenCalledTimes(1);
    expect(mocks.subscriber.subscribe).toHaveBeenCalledWith(
      "user:1",
      expect.any(Function)
    );
  });

  it("delivers messages to subscribed handlers", async () => {
    const emitter = await load();
    const handler = vi.fn();
    emitter.subscribe("user:1", handler);

    emitter.emit("user:1", "hello");

    expect(handler).toHaveBeenCalledWith("hello");
  });

  it.each([[null], [new Error("subscribe failed")]])(
    "tolerates subscribe callback result %s",
    async (err) => {
      const emitter = await load();
      emitter.subscribe("user:1", vi.fn());
      const cb = mocks.subscriber.subscribe.mock.calls[0][1] as Callback;

      expect(() => cb(err)).not.toThrow();
    }
  );

  it("keeps the Redis subscription while other listeners remain", async () => {
    const emitter = await load();
    const a = vi.fn();
    const b = vi.fn();
    emitter.subscribe("user:1", a);
    emitter.subscribe("user:1", b);

    emitter.unsubscribe("user:1", a);
    emitter.emit("user:1", "still-here");

    expect(mocks.subscriber.unsubscribe).not.toHaveBeenCalled();
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith("still-here");
  });

  it("unsubscribes from Redis when the last listener leaves", async () => {
    const emitter = await load();
    const a = vi.fn();
    emitter.subscribe("user:1", a);

    emitter.unsubscribe("user:1", a);

    expect(mocks.subscriber.unsubscribe).toHaveBeenCalledWith(
      "user:1",
      expect.any(Function)
    );
  });

  it("resubscribes after a channel was fully released", async () => {
    const emitter = await load();
    const a = vi.fn();
    emitter.subscribe("user:1", a);
    emitter.unsubscribe("user:1", a);

    emitter.subscribe("user:1", a);

    expect(mocks.subscriber.subscribe).toHaveBeenCalledTimes(2);
  });

  it("treats unsubscribing an unknown channel as releasing it", async () => {
    const emitter = await load();

    emitter.unsubscribe("never-subscribed", vi.fn());

    expect(mocks.subscriber.unsubscribe).toHaveBeenCalledWith(
      "never-subscribed",
      expect.any(Function)
    );
  });

  it.each([[null], [new Error("unsubscribe failed")]])(
    "tolerates unsubscribe callback result %s",
    async (err) => {
      const emitter = await load();
      emitter.unsubscribe("user:1", vi.fn());
      const cb = mocks.subscriber.unsubscribe.mock.calls[0][1] as Callback;

      expect(() => cb(err)).not.toThrow();
    }
  );

  it("reuses the global instance across module reloads", async () => {
    const first = await load();
    vi.resetModules();

    const second = await load();

    expect(second).toBe(first);
    expect(slots.notificationEmitter).toBe(first);
  });
});
