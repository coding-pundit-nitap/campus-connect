import { toZonedTime } from "date-fns-tz";
import { describe, expect, it } from "vitest";

import {
  aggregateEarnings,
  getPeriodRange,
  type OrderMoneyRow,
} from "./earnings";

function order(over: Partial<OrderMoneyRow> = {}): OrderMoneyRow {
  return {
    item_total: 100,
    delivery_fee: 10,
    platform_fee: 5,
    total_price: 115,
    payment_method: "ONLINE",
    ...over,
  };
}

describe("aggregateEarnings", () => {
  it("returns zeros for an empty period", () => {
    const r = aggregateEarnings([]);
    expect(r.vendorEarnings).toBe(0);
    expect(r.customersPaid).toBe(0);
    expect(r.platformFee).toBe(0);
    expect(r.orderCount).toBe(0);
    expect(r.cash.earnings).toBe(0);
    expect(r.online.earnings).toBe(0);
  });

  it("never subtracts the platform fee from vendor earnings", () => {
    const r = aggregateEarnings([order()]);
    expect(r.vendorEarnings).toBe(110);
  });

  it("keeps customersPaid equal to earnings plus platform fee", () => {
    const r = aggregateEarnings([order(), order(), order()]);
    expect(r.customersPaid).toBe(r.vendorEarnings + r.platformFee);
    expect(r.customersPaid).toBe(345);
  });

  it("splits cash and online, and tracks fee owed on cash only", () => {
    const r = aggregateEarnings([
      order({ payment_method: "CASH" }),
      order({ payment_method: "ONLINE" }),
    ]);
    expect(r.cash.earnings).toBe(110);
    expect(r.cash.platformFeeOwed).toBe(5);
    expect(r.cash.orderCount).toBe(1);
    expect(r.online.earnings).toBe(110);
    expect(r.online.orderCount).toBe(1);
  });

  it("keeps the cash and online split summing to total earnings", () => {
    const r = aggregateEarnings([
      order({ payment_method: "CASH" }),
      order({ payment_method: "CASH" }),
      order({ payment_method: "ONLINE" }),
    ]);
    expect(r.cash.earnings + r.online.earnings).toBe(r.vendorEarnings);
  });

  it("does not drift on many fractional amounts", () => {
    const rows = Array.from({ length: 300 }, () =>
      order({
        item_total: 10.1,
        delivery_fee: 0.2,
        platform_fee: 0.05,
        total_price: 10.35,
      })
    );
    const r = aggregateEarnings(rows);
    expect(r.vendorEarnings).toBe(3090);
    expect(r.platformFee).toBe(15);
    expect(r.customersPaid).toBe(3105);
  });
});

describe("getPeriodRange", () => {
  const now = new Date("2026-08-12T15:30:00.000Z");

  it("covers the whole of today", () => {
    const { start, end } = getPeriodRange("today", now);
    // Verify start and end span exactly one IST day (86400 seconds = 86400000 ms).
    // Start at 00:00 IST, end at 23:59:59.999 IST, so difference is ~86399999 ms.
    const durationMs = end.getTime() - start.getTime();
    expect(durationMs).toBeGreaterThanOrEqual(86399999);
    expect(durationMs).toBeLessThanOrEqual(86400000);
    // Verify now falls within the range.
    expect(start < now && now < end).toBe(true);
    // Verify start is at IST midnight (ends with T18:30:00.000Z for IST 00:00).
    const startIST = toZonedTime(start, "Asia/Kolkata");
    expect(startIST.getHours()).toBe(0);
    expect(startIST.getMinutes()).toBe(0);
    expect(startIST.getSeconds()).toBe(0);
  });

  it("starts the week on Monday", () => {
    const { start } = getPeriodRange("week", now);
    // Check that start is Monday in IST (not in UTC, which could be Sunday).
    const startIST = toZonedTime(start, "Asia/Kolkata");
    expect(startIST.getDay()).toBe(1); // Monday
  });

  it("starts the month on the first", () => {
    const { start } = getPeriodRange("month", now);
    // Check that start is the 1st of the month in IST (not in UTC, which could be previous month).
    const startIST = toZonedTime(start, "Asia/Kolkata");
    expect(startIST.getDate()).toBe(1);
  });

  it("always returns start before end", () => {
    for (const p of ["today", "week", "month"] as const) {
      const { start, end } = getPeriodRange(p, now);
      expect(start < end).toBe(true);
    }
  });

  it("computes today correctly in IST even when UTC and IST dates differ", () => {
    // 2026-08-12T00:00:00Z is Aug 12 in UTC, but 05:30 on Aug 12 in IST (UTC+5:30).
    // "Today" should return Aug 12 in IST, showing the IST day boundaries in UTC.
    const utcMidnight = new Date("2026-08-12T00:00:00.000Z");
    const { start, end } = getPeriodRange("today", utcMidnight);

    // The start should be 2026-08-11T18:30:00Z (00:00 IST on Aug 12)
    // and end should be 2026-08-12T18:29:59.999Z (23:59:59 IST on Aug 12).
    expect(start.toISOString()).toBe("2026-08-11T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-08-12T18:29:59.999Z");
    expect(utcMidnight >= start && utcMidnight <= end).toBe(true);
  });

  it("computes week boundaries in IST with Monday start", () => {
    // 2026-08-12T15:30:00Z is 21:00 on Aug 12 in IST (Wednesday).
    // The week should start on Monday Aug 10 in IST.
    const midWeek = new Date("2026-08-12T15:30:00.000Z");
    const { start, end } = getPeriodRange("week", midWeek);

    // Monday Aug 10, 2026 00:00 IST = 2026-08-09T18:30:00Z (Sunday 18:30 UTC)
    // Sunday Aug 16, 2026 23:59:59.999 IST = 2026-08-16T18:29:59.999Z (Friday 18:29:59 UTC)
    expect(start.toISOString()).toBe("2026-08-09T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-08-16T18:29:59.999Z");
    // Verify Monday in IST, not in UTC (which is Sunday).
    const startIST = toZonedTime(start, "Asia/Kolkata");
    expect(startIST.getDay()).toBe(1); // Monday in IST
  });

  it("computes month boundaries in IST", () => {
    // 2026-08-12T15:30:00Z is Aug 12 in IST.
    // Month should start on Aug 1 and end on Aug 31 in IST.
    const someDay = new Date("2026-08-12T15:30:00.000Z");
    const { start, end } = getPeriodRange("month", someDay);

    // Aug 1, 2026 00:00 IST = 2026-07-31T18:30:00Z
    // Aug 31, 2026 23:59:59.999 IST = 2026-08-31T18:29:59.999Z
    expect(start.toISOString()).toBe("2026-07-31T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-08-31T18:29:59.999Z");
  });

  it("proves late-night IST orders bucket into correct IST day", () => {
    // 2026-08-11T23:45:00 IST (late night order) = 2026-08-11T18:15:00Z in UTC (previous calendar day)
    const lateNightIST = new Date("2026-08-11T18:15:00.000Z");
    const { start, end } = getPeriodRange("today", lateNightIST);

    // This order at 18:15 UTC (23:45 IST) should fall inside the IST day of Aug 11,
    // which runs from 2026-08-10T18:30:00Z to 2026-08-11T18:29:59.999Z.
    // This test would FAIL if getPeriodRange used server-local UTC timezone,
    // because the UTC calendar day is Aug 11, not Aug 10-11.
    expect(lateNightIST >= start && lateNightIST <= end).toBe(true);
    expect(start.toISOString()).toBe("2026-08-10T18:30:00.000Z");
    expect(end.toISOString()).toBe("2026-08-11T18:29:59.999Z");
  });
});
