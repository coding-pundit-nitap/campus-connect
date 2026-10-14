import { makeShopWithOwner } from "@tests/helpers/lib/builders";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/client";

import { formatShopData, formatTime, isShopOpen } from "./shop-utils";

const at = (hh: number, mm: number) => {
  vi.setSystemTime(new Date(2026, 0, 1, hh, mm));
};

describe("isShopOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [8, 59, false],
    [9, 0, true],
    [13, 30, true],
    [21, 0, true],
    [21, 1, false],
  ])("same-day 09:00-21:00 at %i:%i -> %s", (hh, mm, expected) => {
    at(hh, mm);

    expect(isShopOpen({ opening: "09:00", closing: "21:00" })).toBe(expected);
  });

  it.each([
    [21, 59, false],
    [22, 0, true],
    [0, 30, true],
    [2, 0, true],
    [2, 1, false],
  ])("overnight 22:00-02:00 at %i:%i -> %s", (hh, mm, expected) => {
    at(hh, mm);

    expect(isShopOpen({ opening: "22:00", closing: "02:00" })).toBe(expected);
  });
});

describe("formatTime", () => {
  it.each([
    ["00:15", "12:15 AM"],
    ["09:05", "9:05 AM"],
    ["12:00", "12:00 PM"],
    ["23:59", "11:59 PM"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });
});

describe("formatShopData", () => {
  it("serialises money fields, dates and adds formatted hours", () => {
    const shop = makeShopWithOwner({
      min_order_value: new Prisma.Decimal("50.00"),
      default_delivery_fee: new Prisma.Decimal("10.50"),
      direct_delivery_fee: new Prisma.Decimal("0"),
    });

    const result = formatShopData(shop);

    expect(result).toMatchObject({
      id: "shop-1",
      min_order_value: "50",
      default_delivery_fee: "10.5",
      direct_delivery_fee: "0",
      user: { name: "Owner", email: "owner@example.com" },
      openingFormatted: "9:00 AM",
      closingFormatted: "9:00 PM",
      created_at: "2026-01-01T00:00:00.000Z",
    });
  });

  it("labels an ownerless shop", () => {
    const result = formatShopData(makeShopWithOwner({ user: null }));

    expect(result.user).toEqual({
      name: "Unknown Owner",
      email: "Unknown Email",
    });
  });

  // convertPrismaDecimals runs first, so serializeMoney only ever sees what it
  // leaves behind; mock-free inputs exercise each of its branches.
  it.each<[unknown, string]>([
    [null, "0"],
    [undefined, "0"],
    ["12.00", "12.00"],
    [15, "15"],
    [BigInt(7), "7"],
    [true, "0"],
    [{ plain: "object" }, "0"],
    [{ toJSON: () => "20.00" }, "20.00"],
    [{ toJSON: () => 21 }, "21"],
    [{ toJSON: () => ({}), toString: () => "22" }, "22"],
    [{ toString: () => "23" }, "23"],
  ])("serialises a money value of %o as %s", (value, expected) => {
    const shop = makeShopWithOwner({
      min_order_value: value as Prisma.Decimal,
    });

    expect(formatShopData(shop).min_order_value).toBe(expected);
  });
});
