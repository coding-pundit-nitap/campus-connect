import { describe, expect, it } from "vitest";

import { upsertItemSchema } from "./cart";

describe("upsertItemSchema", () => {
  it.each([0, 1, 99])("accepts quantity %i", (quantity) => {
    expect(
      upsertItemSchema.safeParse({ product_id: "p", quantity }).success
    ).toBe(true);
  });

  it.each([
    [{ product_id: "p", quantity: -1 }],
    [{ product_id: "p", quantity: 1.5 }],
    [{ product_id: 1, quantity: 1 }],
    [{ quantity: 1 }],
  ])("rejects %j", (input) => {
    expect(upsertItemSchema.safeParse(input).success).toBe(false);
  });
});
