import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => ({
  incr: vi.fn(),
  pexpire: vi.fn(),
  pttl: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({ redisPublisher: redis }));

import { makeRequest, readJson } from "@tests/helpers";

import {
  applyRateLimit,
  getClientIp,
  rateLimit,
  rateLimitResponse,
} from "./rate-limit";

const NOW = new Date("2026-01-01T00:00:00.000Z").getTime();

let ipCounter = 0;
/** Fresh IP per test so the module-level memory store never leaks state. */
const freshRequest = (path = "/api/x") =>
  makeRequest(path, { headers: { "x-real-ip": `10.0.0.${++ipCounter}` } });

const redisDown = () => redis.incr.mockRejectedValue(new Error("down"));

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getClientIp", () => {
    it.each<[HeadersInit, string]>([
      [{ "x-forwarded-for": " 1.1.1.1 , 2.2.2.2" }, "1.1.1.1"],
      [{ "x-real-ip": "3.3.3.3" }, "3.3.3.3"],
      [{ "x-forwarded-for": "4.4.4.4", "x-real-ip": "5.5.5.5" }, "4.4.4.4"],
      [{}, "unknown"],
    ])("resolves %j to %s", (headers, expected) => {
      expect(getClientIp(makeRequest("/", { headers }))).toBe(expected);
    });
  });

  describe("rateLimit with Redis", () => {
    it("sets the window expiry on the first hit and keys by ip + path", async () => {
      redis.incr.mockResolvedValue(1);
      redis.pttl.mockResolvedValue(60_000);
      const req = makeRequest("/api/orders", {
        headers: { "x-real-ip": "9.9.9.9" },
      });

      const result = await rateLimit(req, { limit: 5, windowSeconds: 60 });

      expect(redis.incr).toHaveBeenCalledWith("rl:9.9.9.9:/api/orders");
      expect(redis.pexpire).toHaveBeenCalledWith(
        "rl:9.9.9.9:/api/orders",
        60_000
      );
      expect(result).toEqual({
        success: true,
        remaining: 4,
        resetAt: NOW + 60_000,
      });
    });

    it("does not reset expiry on later hits", async () => {
      redis.incr.mockResolvedValue(3);
      redis.pttl.mockResolvedValue(10_000);

      const result = await rateLimit(freshRequest(), {
        limit: 5,
        windowSeconds: 60,
      });

      expect(redis.pexpire).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        remaining: 2,
        resetAt: NOW + 10_000,
      });
    });

    it("uses the full window when the key has no TTL", async () => {
      redis.incr.mockResolvedValue(2);
      redis.pttl.mockResolvedValue(-1);

      const result = await rateLimit(freshRequest(), {
        limit: 5,
        windowSeconds: 30,
      });

      expect(result.resetAt).toBe(NOW + 30_000);
    });

    it("blocks once the count exceeds the limit", async () => {
      redis.incr.mockResolvedValue(6);
      redis.pttl.mockResolvedValue(5_000);

      const result = await rateLimit(freshRequest(), {
        limit: 5,
        windowSeconds: 60,
      });

      expect(result).toEqual({
        success: false,
        remaining: 0,
        resetAt: NOW + 5_000,
      });
    });

    it("defaults to 60 requests per 60 seconds", async () => {
      redis.incr.mockResolvedValue(1);
      redis.pttl.mockResolvedValue(60_000);

      const result = await rateLimit(freshRequest());

      expect(result.remaining).toBe(59);
      expect(redis.pexpire).toHaveBeenCalledWith(expect.any(String), 60_000);
    });
  });

  describe("rateLimit in-memory fallback", () => {
    it("counts requests per key when Redis is unavailable", async () => {
      redisDown();
      const req = freshRequest();
      const config = { limit: 2, windowSeconds: 60 };

      const first = await rateLimit(req, config);
      const second = await rateLimit(req, config);
      const third = await rateLimit(req, config);

      expect(first).toEqual({
        success: true,
        remaining: 1,
        resetAt: NOW + 60_000,
      });
      expect(second).toEqual({
        success: true,
        remaining: 0,
        resetAt: NOW + 60_000,
      });
      expect(third).toEqual({
        success: false,
        remaining: 0,
        resetAt: NOW + 60_000,
      });
    });

    it("starts a new window after the previous one expires", async () => {
      redisDown();
      const req = freshRequest();
      const config = { limit: 1, windowSeconds: 1 };
      await rateLimit(req, config);
      await rateLimit(req, config);

      vi.setSystemTime(NOW + 1_001);
      const result = await rateLimit(req, config);

      expect(result).toEqual({
        success: true,
        remaining: 0,
        resetAt: NOW + 1_001 + 1_000,
      });
    });
  });

  describe("rateLimitResponse", () => {
    it("returns 429 with Retry-After and reset headers", async () => {
      const res = rateLimitResponse(NOW + 4_500);

      expect(res.headers.get("Retry-After")).toBe("5");
      expect(res.headers.get("X-RateLimit-Reset")).toBe(
        String(Math.ceil((NOW + 4_500) / 1000))
      );
      await expect(readJson(res)).resolves.toEqual({
        status: 429,
        body: { error: "Too many requests. Please try again later." },
      });
    });
  });

  describe("applyRateLimit", () => {
    it("returns null when the request is allowed", async () => {
      redis.incr.mockResolvedValue(1);
      redis.pttl.mockResolvedValue(1_000);

      await expect(applyRateLimit(freshRequest())).resolves.toBeNull();
    });

    it("returns a 429 response when the request is blocked", async () => {
      redis.incr.mockResolvedValue(99);
      redis.pttl.mockResolvedValue(1_000);

      const res = await applyRateLimit(freshRequest() as NextRequest, {
        limit: 1,
        windowSeconds: 1,
      });

      expect(res?.status).toBe(429);
    });
  });
});
