import { describe, expect, it } from "vitest";

import { formatCurrency } from "./currency";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );

describe("formatCurrency", () => {
  it.each<[number | string, string]>([
    [0, inr(0)],
    [1234.5, inr(1234.5)],
    ["99.9", inr(99.9)],
    [100000, inr(100000)],
  ])("formats %j as INR", (value, expected) => {
    expect(formatCurrency(value)).toBe(expected);
  });

  it.each(["abc", Number.NaN])("returns ₹0.00 for non-numeric %j", (value) => {
    expect(formatCurrency(value)).toBe("₹0.00");
  });
});
