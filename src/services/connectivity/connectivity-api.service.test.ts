import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { connectivityAPIService } from "./connectivity-api.service";

const { head } = vi.hoisted(() => ({ head: vi.fn() }));
vi.mock("axios", () => ({ default: { create: vi.fn(() => ({ head })) } }));

const stubNavigator = (nav: Record<string, unknown>) =>
  vi.stubGlobal("navigator", nav);

describe("connectivityAPIService", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  describe("check", () => {
    it("returns false without a request when the browser is offline", async () => {
      stubNavigator({ onLine: false });

      await expect(connectivityAPIService.check()).resolves.toBe(false);
      expect(head).not.toHaveBeenCalled();
    });

    it("returns true when the health endpoint answers", async () => {
      stubNavigator({ onLine: true });
      head.mockResolvedValue({ status: 200 });

      await expect(connectivityAPIService.check()).resolves.toBe(true);
      expect(head).toHaveBeenCalledWith("/api/health/status");
    });

    it("returns false when the health request fails", async () => {
      stubNavigator({ onLine: true });
      head.mockRejectedValue(new Error("down"));

      await expect(connectivityAPIService.check()).resolves.toBe(false);
    });
  });

  describe("getInfo", () => {
    const info = {
      effectiveType: "4g",
      downlink: 10,
      rtt: 50,
      saveData: false,
    };

    it("returns null when no connection API exists", () => {
      stubNavigator({});

      expect(connectivityAPIService.getInfo()).toBeNull();
    });

    it.each(["connection", "mozConnection", "webkitConnection"])(
      "reads navigator.%s",
      (key) => {
        stubNavigator({ [key]: { ...info, extra: 1 } });

        expect(connectivityAPIService.getInfo()).toEqual(info);
      }
    );
  });

  describe("isSlow", () => {
    it("is false when connection info is unavailable", () => {
      stubNavigator({});

      expect(connectivityAPIService.isSlow()).toBe(false);
    });

    it.each([
      [{ effectiveType: "slow-2g" }, true],
      [{ effectiveType: "2g" }, true],
      [{ effectiveType: "4g", downlink: 0.5 }, true],
      [{ effectiveType: "4g", downlink: 5 }, false],
      [{ effectiveType: "3g" }, false],
    ])("connection %j -> %s", (connection, expected) => {
      stubNavigator({ connection });

      expect(connectivityAPIService.isSlow()).toBe(expected);
    });
  });
});
