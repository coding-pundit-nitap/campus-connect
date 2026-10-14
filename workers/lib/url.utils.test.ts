import { describe, expect, it } from "vitest";

import { getOrderUrl, getProductUrl, getShopOrderUrl } from "./url.utils.js";

describe("worker url utils", () => {
  it.each([
    [getOrderUrl, "/orders/o1"],
    [getShopOrderUrl, "/owner-shops/orders/o1"],
    [getProductUrl, "/product/o1"],
  ])("%o builds %s", (fn, expected) => {
    expect(fn("o1")).toBe(expected);
  });
});
