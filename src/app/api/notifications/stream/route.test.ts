import { asMock, overrideEnv, readSse, sseData } from "@tests/helpers/api";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () =>
  (await import("@tests/helpers/api")).prismaModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/notification-emitter", () => ({
  default: { subscribe: vi.fn(), unsubscribe: vi.fn() },
}));
vi.mock("@/lib/redis", () => ({ redisSSE: { zrem: vi.fn() } }));
vi.mock("@/lib/redis-script", () => ({
  trackConnectionAtomic: vi.fn(),
  refreshConnectionHeartbeatAtomic: vi.fn(),
}));

import { env } from "@/config/env.config";
import notificationEmitter from "@/lib/notification-emitter";
import { prisma } from "@/lib/prisma";
import { redisSSE } from "@/lib/redis";
import {
  refreshConnectionHeartbeatAtomic,
  trackConnectionAtomic,
} from "@/lib/redis-script";
import authUtils from "@/lib/utils/auth.utils.server";

import { GET } from "./route";

const auth = vi.mocked(authUtils);
const db = asMock(prisma);
const emitter = vi.mocked(notificationEmitter);
const track = vi.mocked(trackConnectionAtomic);
const refresh = vi.mocked(refreshConnectionHeartbeatAtomic);
const zrem = vi.mocked(redisSSE.zrem);

const NOW = new Date("2026-01-10T00:00:00Z");
const T1 = new Date("2026-01-09T00:00:00Z");
const USER_CHANNEL = "user:user-1:notifications";
const BROADCAST_CHANNEL = "broadcast:notifications";

type Connected = { replay: { truncated: boolean; shouldRefetch: boolean } };

async function open(opts: { header?: string; query?: string } = {}): Promise<{
  res: Response;
  abort: AbortController;
  reader: ReadableStreamDefaultReader<Uint8Array>;
}> {
  const abort = new AbortController();
  const headers: Record<string, string> = {};
  if (opts.header) headers["last-event-id"] = opts.header;
  const req = new NextRequest(
    `http://localhost/api/notifications/stream${opts.query ?? ""}`,
    { headers, signal: abort.signal }
  );
  const res = await GET(req);
  return { res, abort, reader: res.body!.getReader() };
}

const handlerFor = (channel: string) =>
  emitter.subscribe.mock.calls.find(([c]) => c === channel)![1];

const userNote = (id: string, created_at = T1) => ({
  id,
  user_id: "user-1",
  created_at,
});
const broadcast = (id: string, created_at = T1) => ({ id, created_at });

describe("GET /api/notifications/stream", () => {
  let restoreEnv: () => void = () => {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    auth.getUserId.mockResolvedValue("user-1");
    track.mockResolvedValue(true);
    refresh.mockResolvedValue(undefined as never);
    zrem.mockResolvedValue(1 as never);
    db.notification.findMany.mockResolvedValue([]);
    db.broadcastNotification.findMany.mockResolvedValue([]);
    db.notification.findUnique.mockResolvedValue(null);
    db.broadcastNotification.findUnique.mockResolvedValue(null);
  });
  afterEach(() => {
    restoreEnv();
    vi.useRealTimers();
  });

  describe("connection limits", () => {
    it("returns 429 when the user has too many connections", async () => {
      track.mockResolvedValue(false);

      const { res, reader } = await open();

      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe("60");
      expect(JSON.parse((await readSse(reader)).join(""))).toEqual({
        success: false,
        error: `Too many active connections. Maximum ${env.MAX_SSE_CONNECTIONS_PER_USER} connections allowed per user.`,
      });
      expect(emitter.subscribe).not.toHaveBeenCalled();
    });

    it("fails open when connection tracking errors", async () => {
      track.mockRejectedValue(new Error("redis down"));

      const { res } = await open();

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    });
  });

  describe("without a last event id", () => {
    it("sends connected without replay and subscribes to both channels", async () => {
      const { reader } = await open();

      const [chunk] = await readSse(reader);
      expect(chunk).toMatch(/^event: connected\n/);
      expect(sseData(chunk)).toEqual({
        message: "Connection established",
        heartbeatIntervalMs: env.SSE_HEARTBEAT_INTERVAL,
        replay: { truncated: false, shouldRefetch: false },
      });
      expect(emitter.subscribe.mock.calls.map(([c]) => c)).toEqual([
        USER_CHANNEL,
        BROADCAST_CHANNEL,
      ]);
      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("replay", () => {
    it("replays missed notifications after a cursor-format id, oldest first", async () => {
      db.notification.findMany.mockResolvedValue([
        userNote("n2", new Date("2026-01-09T12:00:00Z")),
        userNote("b-tie"),
      ]);
      db.broadcastNotification.findMany.mockResolvedValue([broadcast("a-tie")]);

      const { reader } = await open({ header: `${T1.getTime()}:n0` });
      const chunks = await readSse(reader, 4);

      expect(sseData<Connected>(chunks[0]).replay).toEqual({
        truncated: false,
        shouldRefetch: false,
      });
      expect(chunks.slice(1).map((c) => c.split("\n").slice(0, 2))).toEqual([
        [`id: ${T1.getTime()}:a-tie`, "event: new_broadcast"],
        [`id: ${T1.getTime()}:b-tie`, "event: new_notification"],
        [
          `id: ${new Date("2026-01-09T12:00:00Z").getTime()}:n2`,
          "event: new_notification",
        ],
      ]);
      const where = db.notification.findMany.mock.calls[0][0].where;
      expect(where.user_id).toBe("user-1");
      expect(where.OR[1].AND).toEqual([
        { created_at: T1 },
        { id: { gt: "n0" } },
      ]);
      expect(db.notification.findUnique).not.toHaveBeenCalled();
    });

    it.each([
      ["user", { SSE_REPLAY_USER_LIMIT: 1 }],
      ["broadcast", { SSE_REPLAY_BROADCAST_LIMIT: 1 }],
    ])(
      "flags a truncated %s replay and asks the client to refetch",
      async (_label, limits) => {
        restoreEnv = overrideEnv(env, limits);
        db.notification.findMany.mockResolvedValue([
          userNote("n1"),
          userNote("n2"),
        ]);
        db.broadcastNotification.findMany.mockResolvedValue([
          broadcast("b1"),
          broadcast("b2"),
        ]);

        const { reader } = await open({ header: `${T1.getTime()}:n0` });
        const [connected] = await readSse(reader);

        expect(sseData<Connected>(connected).replay).toEqual({
          truncated: true,
          shouldRefetch: true,
        });
      }
    );

    it("resolves a raw notification id (query param) to a cursor", async () => {
      db.notification.findUnique.mockResolvedValue({
        id: "raw-1",
        created_at: T1,
      });

      const { reader } = await open({ query: "?lastEventId=raw-1" });
      const [connected] = await readSse(reader);

      expect(sseData<Connected>(connected).replay.shouldRefetch).toBe(false);
      expect(db.notification.findMany.mock.calls[0][0].where.OR[1].AND).toEqual(
        [{ created_at: T1 }, { id: { gt: "raw-1" } }]
      );
    });

    it("resolves a raw broadcast id when no notification matches", async () => {
      db.broadcastNotification.findUnique.mockResolvedValue({
        id: "raw-b",
        created_at: T1,
      });

      const { reader } = await open({ header: "raw-b" });
      await readSse(reader);

      expect(db.notification.findMany).toHaveBeenCalled();
    });

    it.each([":abc", "123:", "abc:def", "99999999999999999:x", "plain-id"])(
      "asks for a refetch when last event id %s cannot be resolved",
      async (lastEventId) => {
        const { reader } = await open({ header: lastEventId });
        const [connected] = await readSse(reader);

        expect(sseData<Connected>(connected).replay).toEqual({
          truncated: false,
          shouldRefetch: true,
        });
        expect(db.notification.findUnique).toHaveBeenCalledWith({
          where: { id: lastEventId },
          select: { id: true, created_at: true },
        });
        expect(db.notification.findMany).not.toHaveBeenCalled();
      }
    );
  });

  describe("live events", () => {
    it.each([
      [USER_CHANNEL, "new_notification"],
      [BROADCAST_CHANNEL, "new_broadcast"],
    ])("forwards %s messages as %s", async (channel, event) => {
      const { reader } = await open();
      await readSse(reader);

      handlerFor(channel)(
        JSON.stringify({ id: "x1", created_at: T1.toISOString() })
      );

      const [chunk] = await readSse(reader);
      expect(chunk.split("\n").slice(0, 2)).toEqual([
        `id: ${T1.getTime()}:x1`,
        `event: ${event}`,
      ]);
      expect(sseData(chunk)).toEqual({
        id: "x1",
        created_at: T1.toISOString(),
      });
    });

    it("uses the current time in the event id for an invalid created_at", async () => {
      const { reader } = await open();
      await readSse(reader);

      handlerFor(USER_CHANNEL)(
        JSON.stringify({ id: "x1", created_at: "not-a-date" })
      );

      const [chunk] = await readSse(reader);
      expect(chunk).toMatch(new RegExp(`^id: ${NOW.getTime()}:x1\n`));
    });

    it("drops malformed messages without breaking the stream", async () => {
      const { reader } = await open();
      await readSse(reader);

      expect(() => handlerFor(USER_CHANNEL)("{not json")).not.toThrow();
      handlerFor(USER_CHANNEL)(JSON.stringify({ id: "ok", created_at: T1 }));

      const [chunk] = await readSse(reader);
      expect(chunk).toContain(":ok\n");
    });
  });

  describe("heartbeat", () => {
    it("pings and refreshes the connection TTL each interval", async () => {
      const { reader } = await open();
      await readSse(reader);

      await vi.advanceTimersByTimeAsync(env.SSE_HEARTBEAT_INTERVAL);

      const [ping] = await readSse(reader);
      expect(ping).toMatch(/^event: ping\n/);
      expect(refresh).toHaveBeenCalledWith(
        "user-1",
        expect.any(String),
        env.SSE_CONNECTION_TTL
      );
      expect(refresh.mock.calls[0][1]).toBe(track.mock.calls[0][1]);
    });

    it("closes the stream and cleans up when the refresh fails", async () => {
      refresh.mockRejectedValue(new Error("redis down"));
      const { reader } = await open();
      await readSse(reader);

      await vi.advanceTimersByTimeAsync(env.SSE_HEARTBEAT_INTERVAL);

      await readSse(reader); // the ping enqueued before the failure
      expect((await reader.read()).done).toBe(true);
      expect(emitter.unsubscribe).toHaveBeenCalledTimes(2);
      expect(zrem).toHaveBeenCalledTimes(1);
    });
  });

  describe("cleanup", () => {
    it("unsubscribes and untracks the connection on abort", async () => {
      const { abort, reader } = await open();
      await readSse(reader);

      abort.abort();

      expect(emitter.unsubscribe.mock.calls).toEqual([
        [USER_CHANNEL, handlerFor(USER_CHANNEL)],
        [BROADCAST_CHANNEL, handlerFor(BROADCAST_CHANNEL)],
      ]);
      expect(zrem).toHaveBeenCalledWith(
        "sse:connections:user-1",
        track.mock.calls[0][1]
      );
      expect((await reader.read()).done).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("cleans up only once across cancel and abort", async () => {
      const { abort, reader } = await open();

      await reader.cancel();
      abort.abort();

      expect(emitter.unsubscribe).toHaveBeenCalledTimes(2);
      expect(zrem).toHaveBeenCalledTimes(1);
    });

    it("swallows untrack failures", async () => {
      zrem.mockRejectedValue(new Error("redis down"));
      const { abort } = await open();

      expect(() => abort.abort()).not.toThrow();
      await vi.runAllTimersAsync();
      expect(zrem).toHaveBeenCalledTimes(1);
    });

    it("tolerates a heartbeat firing after the stream closed", async () => {
      const intervals = vi.spyOn(globalThis, "setInterval");
      const { abort } = await open();
      const heartbeat = intervals.mock.calls[0][0] as () => Promise<void>;

      abort.abort();

      await expect(heartbeat()).resolves.toBeUndefined();
    });
  });
});
