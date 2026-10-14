import { describe, expect, it } from "vitest";

import { getOrderUrl, getProductUrl, getShopOrderUrl } from "./url.utils";

describe("url.utils", () => {
  it.each([
    [getOrderUrl, "/orders/abc"],
    [getShopOrderUrl, "/owner-shops/orders/abc"],
    [getProductUrl, "/product/abc"],
  ])("%o builds %s", (fn, expected) => {
    expect(fn("abc")).toBe(expected);
  });
});
