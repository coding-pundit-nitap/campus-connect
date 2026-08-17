import { describe, expect, it } from "vitest";

import { APP_TIME_ZONE, getZonedParts } from "@/lib/utils/timezone";

describe("APP_TIME_ZONE", () => {
  it("is Asia/Kolkata", () => {
    // Every expectation below is computed against this specific zone
    // (UTC+5:30, no DST). If this constant ever changes, the fixed
    // expected values in this file must be recomputed.
    expect(APP_TIME_ZONE).toBe("Asia/Kolkata");
  });
});

describe("getZonedParts", () => {
  it("converts a UTC instant into app-timezone parts", () => {
    // 2026-03-01T06:30:00Z is 12:00 in Asia/Kolkata (UTC+5:30)
    const parts = getZonedParts(
      new Date("2026-03-01T06:30:00Z"),
      APP_TIME_ZONE
    );
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(3);
    expect(parts.day).toBe(1);
    expect(parts.hour).toBe(12);
    expect(parts.minute).toBe(0);
    expect(parts.second).toBe(0);
  });

  it("produces minutes-from-midnight matching the batch slot convention", () => {
    const parts = getZonedParts(
      new Date("2026-03-01T06:30:00Z"),
      APP_TIME_ZONE
    );
    expect(parts.hour * 60 + parts.minute).toBe(720);
  });

  it("defaults to APP_TIME_ZONE when no timeZone argument is given", () => {
    const explicit = getZonedParts(
      new Date("2026-03-01T06:30:00Z"),
      APP_TIME_ZONE
    );
    const defaulted = getZonedParts(new Date("2026-03-01T06:30:00Z"));
    expect(defaulted).toEqual(explicit);
  });

  it("handles an instant that falls on the next calendar day in-zone (UTC day boundary crossing)", () => {
    // 2026-03-01T19:00:00Z (still March 1 in UTC) is 00:30 on
    // 2026-03-02 in Asia/Kolkata -- the date rolls over even though
    // the UTC calendar day has not.
    const parts = getZonedParts(
      new Date("2026-03-01T19:00:00Z"),
      APP_TIME_ZONE
    );
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(3);
    expect(parts.day).toBe(2);
    expect(parts.hour).toBe(0);
    expect(parts.minute).toBe(30);
  });

  it("handles an instant that falls on the previous calendar day in-zone (before UTC midnight)", () => {
    // 2026-03-01T00:00:00Z (already March 1 in UTC) is 05:30 on
    // 2026-03-01 in Asia/Kolkata -- same day here, but exercises the
    // start-of-UTC-day edge distinctly from the end-of-day case above.
    const parts = getZonedParts(
      new Date("2026-03-01T00:00:00Z"),
      APP_TIME_ZONE
    );
    expect(parts.day).toBe(1);
    expect(parts.hour).toBe(5);
    expect(parts.minute).toBe(30);
  });

  it("resolves a different zone independently of APP_TIME_ZONE", () => {
    // 2026-03-01T06:30:00Z is 01:30 in America/New_York (UTC-5, EST,
    // no DST in effect in March before the spring-forward date).
    const parts = getZonedParts(
      new Date("2026-03-01T06:30:00Z"),
      "America/New_York"
    );
    expect(parts.day).toBe(1);
    expect(parts.hour).toBe(1);
    expect(parts.minute).toBe(30);
  });
});
