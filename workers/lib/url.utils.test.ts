import { describe, expect, it } from "vitest";

import {
  getOrderUrl,
  getProductUrl,
  getShopOrderUrl,
  toAbsoluteUrl,
} from "./url.utils.js";

describe("worker url utils", () => {
  it.each([
    [getOrderUrl, "/orders/o1"],
    [getShopOrderUrl, "/owner-shops/orders/o1"],
    [getProductUrl, "/product/o1"],
  ])("%o builds %s", (fn, expected) => {
    expect(fn("o1")).toBe(expected);
  });
});

describe("toAbsoluteUrl", () => {
  const base = "https://app.example";

  it.each([
    ["/orders/1", "https://app.example/orders/1"],
    ["orders/1", "https://app.example/orders/1"],
    ["https://other.example/x", "https://other.example/x"],
    ["http://other.example/x", "http://other.example/x"],
  ])("resolves %s to %s", (input, expected) => {
    expect(toAbsoluteUrl(input, base)).toBe(expected);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:text/html,x"],
  ])("returns null for %s", (_label, input) => {
    expect(toAbsoluteUrl(input, base)).toBeNull();
  });

  it("returns null when the base URL is unusable", () => {
    expect(toAbsoluteUrl("/x", "not a url")).toBeNull();
  });
});
