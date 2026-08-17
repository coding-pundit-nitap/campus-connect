import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deliveryTimeSchema,
  isWithinShopHours,
  parseTimeString,
  upiTransactionIdSchema,
  validateDeliveryTime,
} from "./order.validation";

const NOW = new Date("2026-08-14T10:00:00Z");
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("parseTimeString", () => {
  it("parses a two-digit HH:MM string", () => {
    expect(parseTimeString("09:30")).toEqual({ hours: 9, minutes: 30 });
  });

  it("accepts a single-digit hour", () => {
    expect(parseTimeString("9:30")).toEqual({ hours: 9, minutes: 30 });
  });

  it("accepts the boundary values 00:00 and 23:59", () => {
    expect(parseTimeString("00:00")).toEqual({ hours: 0, minutes: 0 });
    expect(parseTimeString("23:59")).toEqual({ hours: 23, minutes: 59 });
  });

  it("rejects an hour of 24", () => {
    expect(parseTimeString("24:00")).toBeNull();
  });

  it("rejects a minute of 60", () => {
    expect(parseTimeString("12:60")).toBeNull();
  });

  it("rejects strings that do not match H:MM / HH:MM", () => {
    expect(parseTimeString("not-a-time")).toBeNull();
    expect(parseTimeString("9:5")).toBeNull();
    expect(parseTimeString("")).toBeNull();
  });
});

describe("isWithinShopHours", () => {
  // Shop hours "09:00"-"21:00" are compared against the delivery time's
  // Asia/Kolkata (IST, UTC+5:30) wall-clock hour/minute, not UTC.
  it("accepts a delivery time within a same-day opening window", () => {
    // 2026-08-14T06:30:00Z = 12:00 IST
    expect(
      isWithinShopHours(new Date("2026-08-14T06:30:00Z"), "09:00", "21:00")
    ).toBe(true);
  });

  it("rejects a delivery time before opening", () => {
    // 2026-08-14T02:30:00Z = 08:00 IST
    expect(
      isWithinShopHours(new Date("2026-08-14T02:30:00Z"), "09:00", "21:00")
    ).toBe(false);
  });

  it("includes the opening-time boundary", () => {
    // 2026-08-14T03:30:00Z = 09:00 IST exactly
    expect(
      isWithinShopHours(new Date("2026-08-14T03:30:00Z"), "09:00", "21:00")
    ).toBe(true);
  });

  it("includes the closing-time boundary", () => {
    // 2026-08-14T15:30:00Z = 21:00 IST exactly
    expect(
      isWithinShopHours(new Date("2026-08-14T15:30:00Z"), "09:00", "21:00")
    ).toBe(true);
  });

  it("rejects a delivery time one minute after closing", () => {
    // 2026-08-14T15:31:00Z = 21:01 IST
    expect(
      isWithinShopHours(new Date("2026-08-14T15:31:00Z"), "09:00", "21:00")
    ).toBe(false);
  });

  it("handles an overnight window that wraps past midnight", () => {
    // opening 22:00, closing 02:00 -> valid range wraps across midnight
    // 2026-08-14T17:30:00Z = 23:00 IST (after opening, before midnight)
    expect(
      isWithinShopHours(new Date("2026-08-14T17:30:00Z"), "22:00", "02:00")
    ).toBe(true);
    // 2026-08-14T19:30:00Z = 01:00 IST (after midnight, before closing)
    expect(
      isWithinShopHours(new Date("2026-08-14T19:30:00Z"), "22:00", "02:00")
    ).toBe(true);
    // 2026-08-14T04:30:00Z = 10:00 IST (outside the overnight window)
    expect(
      isWithinShopHours(new Date("2026-08-14T04:30:00Z"), "22:00", "02:00")
    ).toBe(false);
  });

  it("fails closed (returns false) when the opening or closing string is unparsable", () => {
    expect(
      isWithinShopHours(new Date("2026-08-14T06:30:00Z"), "bad", "21:00")
    ).toBe(false);
    expect(
      isWithinShopHours(new Date("2026-08-14T06:30:00Z"), "09:00", "bad")
    ).toBe(false);
  });
});

describe("validateDeliveryTime", () => {
  it("returns null when no delivery time is given", () => {
    expect(validateDeliveryTime(undefined)).toBeNull();
  });

  it("returns null for a delivery time comfortably within bounds", () => {
    expect(validateDeliveryTime(new Date(NOW.getTime() + DAY))).toBeNull();
  });

  it("rejects a delivery time one millisecond short of the 15-minute minimum", () => {
    const tooSoon = new Date(NOW.getTime() + 15 * MINUTE - 1);
    expect(validateDeliveryTime(tooSoon)).toBe(
      "Delivery time must be at least 15 minutes from now"
    );
  });

  it("accepts a delivery time exactly at the 15-minute minimum boundary", () => {
    const exactlyMin = new Date(NOW.getTime() + 15 * MINUTE);
    expect(validateDeliveryTime(exactlyMin)).toBeNull();
  });

  it("accepts a delivery time exactly at the 7-day maximum boundary", () => {
    const exactlyMax = new Date(NOW.getTime() + 7 * DAY);
    expect(validateDeliveryTime(exactlyMax)).toBeNull();
  });

  it("rejects a delivery time one millisecond past the 7-day maximum", () => {
    const tooFar = new Date(NOW.getTime() + 7 * DAY + 1);
    expect(validateDeliveryTime(tooFar)).toBe(
      "Delivery time must be within 7 days"
    );
  });

  it("returns null when within both the time window and shop hours", () => {
    // NOW + 1 day = 2026-08-15T10:00:00Z = 15:30 IST, inside 09:00-21:00
    const withinShopHours = new Date(NOW.getTime() + DAY);
    expect(validateDeliveryTime(withinShopHours, "09:00", "21:00")).toBeNull();
  });

  it("returns a shop-hours error when outside shop hours but within the time window", () => {
    // 2026-08-14T17:30:00Z = 23:00 IST, outside 09:00-21:00, but still
    // within the 15-min/7-day window relative to NOW.
    const outsideShopHours = new Date("2026-08-14T17:30:00Z");
    expect(validateDeliveryTime(outsideShopHours, "09:00", "21:00")).toBe(
      "Delivery time must be within shop hours (09:00 - 21:00)"
    );
  });
});

describe("deliveryTimeSchema", () => {
  it("accepts undefined (optional)", () => {
    expect(deliveryTimeSchema.safeParse(undefined).success).toBe(true);
  });

  it("accepts a date comfortably within bounds", () => {
    const result = deliveryTimeSchema.safeParse(new Date(NOW.getTime() + DAY));
    expect(result.success).toBe(true);
  });

  it("rejects a date less than 15 minutes away", () => {
    const result = deliveryTimeSchema.safeParse(
      new Date(NOW.getTime() + 5 * MINUTE)
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Delivery time must be at least 15 minutes from now"
      );
    }
  });

  it("rejects a date more than 7 days away", () => {
    const result = deliveryTimeSchema.safeParse(
      new Date(NOW.getTime() + 8 * DAY)
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Delivery time must be within 7 days"
      );
    }
  });
});

describe("upiTransactionIdSchema", () => {
  it("accepts undefined (optional)", () => {
    expect(upiTransactionIdSchema.safeParse(undefined).success).toBe(true);
  });

  it("accepts an alphanumeric id at the 10-character minimum", () => {
    expect(upiTransactionIdSchema.safeParse("A".repeat(10)).success).toBe(true);
  });

  it("accepts an alphanumeric id at the 35-character maximum", () => {
    expect(upiTransactionIdSchema.safeParse("A".repeat(35)).success).toBe(true);
  });

  it("rejects an id one character short of the minimum", () => {
    expect(upiTransactionIdSchema.safeParse("A".repeat(9)).success).toBe(false);
  });

  it("rejects an id one character past the maximum", () => {
    expect(upiTransactionIdSchema.safeParse("A".repeat(36)).success).toBe(
      false
    );
  });

  it("rejects ids containing non-alphanumeric characters", () => {
    expect(upiTransactionIdSchema.safeParse("ABCDE-1234").success).toBe(false);
  });
});
