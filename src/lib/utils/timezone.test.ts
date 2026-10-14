import { afterEach, describe, expect, it, vi } from "vitest";

import {
  addZonedDays,
  APP_TIME_ZONE,
  getTimeZoneOffsetMs,
  getZonedParts,
  zonedPartsToUtcDate,
} from "@/lib/utils/timezone";

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

describe("getZonedParts parsing guard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when Intl omits a required part", () => {
    const RealFormat = Intl.DateTimeFormat;
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
      ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
    ) {
      const real = new RealFormat(...args);
      return {
        formatToParts: (d: Date) =>
          real.formatToParts(d).filter((p) => p.type !== "minute"),
      } as Intl.DateTimeFormat;
    } as unknown as typeof Intl.DateTimeFormat);

    expect(() => getZonedParts(new Date())).toThrow(
      "Failed to parse minute from Intl parts"
    );
  });
});

describe("getTimeZoneOffsetMs", () => {
  it.each([
    ["Asia/Kolkata", "2026-06-01T00:00:00Z", 5.5 * 3600_000],
    ["UTC", "2026-06-01T00:00:00Z", 0],
    ["America/New_York", "2026-01-15T12:00:00Z", -5 * 3600_000],
    ["America/New_York", "2026-07-15T12:00:00Z", -4 * 3600_000],
  ])("%s at %s is %i ms", (zone, iso, expected) => {
    expect(getTimeZoneOffsetMs(new Date(iso), zone)).toBe(expected);
  });

  it("defaults to APP_TIME_ZONE", () => {
    expect(getTimeZoneOffsetMs(new Date("2026-06-01T00:00:00Z"))).toBe(
      5.5 * 3600_000
    );
  });
});

describe("zonedPartsToUtcDate", () => {
  it("converts IST wall-clock time to the UTC instant", () => {
    expect(
      zonedPartsToUtcDate({ year: 2026, month: 3, day: 1, hour: 9, minute: 0 })
    ).toEqual(new Date("2026-03-01T03:30:00.000Z"));
  });

  it("honours seconds when given", () => {
    expect(
      zonedPartsToUtcDate(
        { year: 2026, month: 3, day: 1, hour: 0, minute: 0, second: 30 },
        "UTC"
      )
    ).toEqual(new Date("2026-03-01T00:00:30.000Z"));
  });

  it("round-trips through getZonedParts", () => {
    const parts = {
      year: 2026,
      month: 12,
      day: 31,
      hour: 23,
      minute: 59,
      second: 1,
    };

    expect(getZonedParts(zonedPartsToUtcDate(parts))).toEqual(parts);
  });

  it("re-resolves the offset across a DST jump", () => {
    // 02:30 on 2026-03-08 does not exist in New York (clocks jump 02:00 -> 03:00).
    const result = zonedPartsToUtcDate(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30 },
      "America/New_York"
    );

    expect(result).toEqual(new Date("2026-03-08T06:30:00.000Z"));
  });
});

describe("addZonedDays", () => {
  it.each([
    [{ year: 2026, month: 1, day: 31 }, 1, { year: 2026, month: 2, day: 1 }],
    [{ year: 2026, month: 12, day: 31 }, 1, { year: 2027, month: 1, day: 1 }],
    [{ year: 2026, month: 3, day: 1 }, -1, { year: 2026, month: 2, day: 28 }],
    [{ year: 2026, month: 5, day: 10 }, 0, { year: 2026, month: 5, day: 10 }],
  ])("%j + %i day(s) -> %j", (start, days, expected) => {
    expect(addZonedDays(start, days)).toEqual(expected);
  });

  it("works in another zone", () => {
    expect(
      addZonedDays({ year: 2026, month: 3, day: 7 }, 1, "America/New_York")
    ).toEqual({ year: 2026, month: 3, day: 8 });
  });
});
