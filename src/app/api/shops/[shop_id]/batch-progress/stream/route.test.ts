import { routeParams } from "@tests/helpers";
import { readSse, sseData } from "@tests/helpers/api";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/notification-emitter", () => ({
  default: { subscribe: vi.fn(), unsubscribe: vi.fn() },
}));

import notificationEmitter from "@/lib/notification-emitter";

import { GET } from "./route";

const emitter = vi.mocked(notificationEmitter);

async function open() {
  const abort = new AbortController();
  const req = new NextRequest(
    "http://localhost/api/shops/s1/batch-progress/stream",
    {
      signal: abort.signal,
    }
  );
  const res = await GET(req, routeParams({ shop_id: "s1" }));
  const reader = res.body!.getReader();
  const handler = () => emitter.subscribe.mock.calls[0][1];
  return { abort, res, reader, handler };
}

describe("GET /api/shops/[shop_id]/batch-progress/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("opens an SSE stream with a connected event", async () => {
    const { res, reader } = await open();

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const [chunk] = await readSse(reader);
    expect(chunk).toMatch(/^event: connected\n/);
    expect(sseData(chunk)).toEqual({ shop_id: "s1" });
    expect(emitter.subscribe).toHaveBeenCalledWith(
      expect.stringContaining("s1"),
      expect.any(Function)
    );
  });

  it("forwards published progress messages", async () => {
    const { reader, handler } = await open();
    await readSse(reader);

    handler()('{"total":5}');

    expect(await readSse(reader)).toEqual([
      'event: batch_progress\ndata: {"total":5}\n\n',
    ]);
  });

  it("sends a ping every 15 seconds", async () => {
    const { reader } = await open();
    await readSse(reader);

    vi.advanceTimersByTime(15_000);

    const [ping] = await readSse(reader);
    expect(ping).toMatch(/^event: ping\n/);
    expect(sseData<{ ts: number }>(ping).ts).toBe(Date.now());
  });

  it("unsubscribes and closes when the client aborts", async () => {
    const { abort, reader, handler } = await open();
    await readSse(reader);

    abort.abort();

    expect(emitter.unsubscribe).toHaveBeenCalledWith(
      emitter.subscribe.mock.calls[0][0],
      handler()
    );
    expect((await reader.read()).done).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up once when the reader cancels", async () => {
    const { abort, reader } = await open();

    await reader.cancel();
    abort.abort();

    expect(emitter.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("swallows enqueue errors after the stream has closed", async () => {
    const intervals = vi.spyOn(globalThis, "setInterval");
    const { abort, handler } = await open();
    const heartbeat = intervals.mock.calls[0][0] as () => void;

    abort.abort();

    expect(() => handler()("late")).not.toThrow();
    expect(() => heartbeat()).not.toThrow();
    expect(emitter.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
