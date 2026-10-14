import { describe, expect, it } from "vitest";

import type { SerializedOrderWithDetails } from "@/types";

import { buildPrepSummary, getItemsText, groupByHostel } from "./order-utils";

const item = (id: string, name: string, quantity: number) => ({
  quantity,
  product: { id, name },
});

const order = (
  id: string,
  items: ReturnType<typeof item>[],
  snapshot: {
    hostel_block?: string | null;
    building?: string | null;
  } | null = null
) =>
  ({
    id,
    items,
    delivery_address_snapshot: snapshot,
  }) as unknown as SerializedOrderWithDetails;

describe("getItemsText", () => {
  it("joins quantities and product names", () => {
    expect(
      getItemsText(order("o1", [item("p1", "Tea", 2), item("p2", "Bun", 1)]))
    ).toBe("2× Tea, 1× Bun");
  });

  it("is empty for an order without items", () => {
    expect(getItemsText(order("o1", []))).toBe("");
  });
});

describe("groupByHostel", () => {
  it("groups by hostel block, then building, then 'Other'", () => {
    const a = order("a", [], { hostel_block: "H1", building: "B1" });
    const b = order("b", [], { hostel_block: null, building: "B1" });
    const c = order("c", [], { hostel_block: "", building: "" });
    const d = order("d", [], null);
    const e = order("e", [], { hostel_block: "H1" });

    expect(groupByHostel([a, b, c, d, e])).toEqual({
      H1: [a, e],
      B1: [b],
      Other: [c, d],
    });
  });

  it("returns an empty object for no orders", () => {
    expect(groupByHostel([])).toEqual({});
  });
});

describe("buildPrepSummary", () => {
  it("sums quantities per product across orders, sorted by name", () => {
    const orders = [
      order("o1", [item("p1", "Tea", 2), item("p2", "Bun", 1)]),
      order("o2", [item("p1", "Tea", 3)]),
    ];

    expect(buildPrepSummary(orders)).toEqual([
      { name: "Bun", quantity: 1 },
      { name: "Tea", quantity: 5 },
    ]);
  });

  it("keys by product id so same-named products stay separate", () => {
    const orders = [order("o1", [item("p1", "Tea", 1), item("p2", "Tea", 1)])];

    expect(buildPrepSummary(orders)).toHaveLength(2);
  });
});
