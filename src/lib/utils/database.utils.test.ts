import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkDatabaseConnectivity, getDatabaseStatus } from "./database.utils";

const fetchMock = vi.fn();
const respond = (ok: boolean, body: unknown = {}) =>
  fetchMock.mockResolvedValue({ ok, json: async () => body });

describe("database.utils", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("checkDatabaseConnectivity", () => {
    it("calls the health endpoint without caching", async () => {
      respond(true, { success: true });

      await checkDatabaseConnectivity();

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/health/database",
        expect.objectContaining({
          method: "GET",
          cache: "no-cache",
          signal: expect.any(AbortSignal),
        })
      );
    });

    it.each<[boolean, unknown, boolean]>([
      [true, { success: true }, true],
      [true, { success: false }, false],
      [true, { success: "yes" }, false],
      [false, { success: true }, false],
    ])("ok=%s body=%j -> %s", async (ok, body, expected) => {
      respond(ok, body);

      await expect(checkDatabaseConnectivity()).resolves.toBe(expected);
    });

    it("returns false when the request fails", async () => {
      fetchMock.mockRejectedValue(new Error("offline"));

      await expect(checkDatabaseConnectivity()).resolves.toBe(false);
    });

    it("aborts the request after 10 seconds", async () => {
      vi.useFakeTimers();
      let signal: AbortSignal | undefined;
      fetchMock.mockImplementation(
        (_url: string, init: { signal: AbortSignal }) => {
          signal = init.signal;
          return new Promise((_resolve, reject) =>
            init.signal.addEventListener("abort", () =>
              reject(new Error("aborted"))
            )
          );
        }
      );

      const pending = checkDatabaseConnectivity();
      await vi.advanceTimersByTimeAsync(10_000);

      await expect(pending).resolves.toBe(false);
      expect(signal?.aborted).toBe(true);
    });
  });

  describe("getDatabaseStatus", () => {
    it("reports latency when connected", async () => {
      respond(true, { success: true });

      const status = await getDatabaseStatus();

      expect(status.isConnected).toBe(true);
      expect(status.latency).toEqual(expect.any(Number));
    });

    it("omits latency when disconnected", async () => {
      respond(false);

      await expect(getDatabaseStatus()).resolves.toEqual({
        isConnected: false,
        latency: undefined,
      });
    });

    it.each([
      [new Error("timer broke"), "timer broke"],
      ["weird", "Unknown error"],
    ])("reports %o thrown while measuring as %s", async (thrown, message) => {
      respond(true, { success: true });
      vi.spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockImplementationOnce(() => {
          throw thrown;
        });

      await expect(getDatabaseStatus()).resolves.toEqual({
        isConnected: false,
        error: message,
      });
    });
  });
});
