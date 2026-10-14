import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./redis", () => ({ redisPublisher: { eval: vi.fn() } }));

import { redisPublisher } from "./redis";
import {
  refreshConnectionHeartbeatAtomic,
  trackConnectionAtomic,
} from "./redis-script";

const NOW = new Date("2026-01-01T00:00:00.000Z").getTime();
const evalMock = vi.mocked(redisPublisher.eval);

describe("redis-script", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    evalMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("trackConnectionAtomic", () => {
    it("runs the tracking script with key and stringified args", async () => {
      evalMock.mockResolvedValue(1);

      await trackConnectionAtomic("user-1", "conn-1", 5, 300);

      expect(evalMock).toHaveBeenCalledWith(
        expect.stringContaining("ZCARD"),
        1,
        "sse:connections:user-1",
        "conn-1",
        String(NOW),
        String(NOW - 300_000),
        "5",
        "300"
      );
    });

    it.each([
      [1, true],
      ["1", true],
      [0, false],
      [null, false],
    ])("maps script result %j to %s", async (result, expected) => {
      evalMock.mockResolvedValue(result);

      await expect(trackConnectionAtomic("u", "c", 1, 1)).resolves.toBe(
        expected
      );
    });
  });

  describe("refreshConnectionHeartbeatAtomic", () => {
    it("runs the refresh script and returns the live connection count", async () => {
      evalMock.mockResolvedValue("3");

      const count = await refreshConnectionHeartbeatAtomic("user-1", "c", 60);

      expect(count).toBe(3);
      expect(evalMock).toHaveBeenCalledWith(
        expect.stringContaining("EXPIRE"),
        1,
        "sse:connections:user-1",
        "c",
        String(NOW),
        String(NOW - 60_000),
        "60"
      );
    });
  });
});
