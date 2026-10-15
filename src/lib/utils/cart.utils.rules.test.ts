import { describe, expect, it } from "vitest";

import { cartUIService, discountedUnitPricePaise } from "./cart.utils";

const item = (price: number, discount: number, quantity: number) =>
  ({ price, discount, quantity }) as never;

describe("pricing rules (cart.utils)", () => {
  it("RULE O1: the discount is a percent of the price", () => {
    expect(discountedUnitPricePaise(120, 25)).toBe(9000);
    expect(discountedUnitPricePaise(100, 0)).toBe(10000);
    expect(discountedUnitPricePaise(100, null)).toBe(10000);
    expect(discountedUnitPricePaise(100, undefined)).toBe(10000);
  });

  it("RULE O7: each unit price is rounded to whole paise", () => {
    // 33.33 * 0.9 = 29.997 -> 30.00
    expect(discountedUnitPricePaise(33.33, 10)).toBe(3000);
    // 19.99 * 0.95 = 18.9905 -> 18.99
    expect(discountedUnitPricePaise(19.99, 5)).toBe(1899);
  });

  it("RULE O9: a price never goes negative (discount clamped to 0..100)", () => {
    expect(discountedUnitPricePaise(100, 150)).toBe(0);
    expect(discountedUnitPricePaise(100, 100)).toBe(0);
    expect(discountedUnitPricePaise(100, -20)).toBe(10000);
  });

  it("RULE O2/O6: the cart total is the sum of rounded unit prices x quantity", () => {
    expect(
      cartUIService.calculateCartItemsPrice([
        item(33.33, 10, 3),
        item(19.99, 5, 7),
        item(80, 0, 1),
      ])
    ).toBe(90 + 132.93 + 80);
    expect(cartUIService.calculateCartItemsPrice([])).toBe(0);
  });

  it("RULE O7: the cart total has at most 2 decimals", () => {
    const total = cartUIService.calculateCartItemsPrice([
      item(0.1, 0, 1),
      item(0.2, 0, 1),
    ]);
    expect(total).toBe(0.3);
  });
});
