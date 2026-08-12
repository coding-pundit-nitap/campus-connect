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
    expect(start.getDate()).toBe(end.getDate());
    expect(start.getHours()).toBe(0);
    expect(start < now && now < end).toBe(true);
  });

  it("starts the week on Monday", () => {
    const { start } = getPeriodRange("week", now);
    expect(start.getDay()).toBe(1);
  });

  it("starts the month on the first", () => {
    const { start } = getPeriodRange("month", now);
    expect(start.getDate()).toBe(1);
  });

  it("always returns start before end", () => {
    for (const p of ["today", "week", "month"] as const) {
      const { start, end } = getPeriodRange(p, now);
      expect(start < end).toBe(true);
    }
  });
});
