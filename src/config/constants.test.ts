import { describe, expect, it } from "vitest";

import {
  NEW_ORDER_NOTIFICATION_TITLE,
  VALID_ORDER_TRANSITIONS,
} from "./constants";

describe("constants", () => {
  it("exposes the new-order notification title", () => {
    expect(NEW_ORDER_NOTIFICATION_TITLE).toBe("New Order Received");
  });

  it.each([
    ["COMPLETED", []],
    ["CANCELLED", []],
    ["NEW", ["BATCHED", "CANCELLED"]],
    ["DELIVERY_FAILED", ["CANCELLED"]],
  ] as const)("allows %s -> %j", (from, to) => {
    expect(VALID_ORDER_TRANSITIONS[from]).toEqual(to);
  });

  it("lets every non-terminal status be cancelled", () => {
    const nonTerminal = Object.entries(VALID_ORDER_TRANSITIONS).filter(
      ([, next]) => next.length > 0
    );
    for (const [, next] of nonTerminal) {
      expect(next).toContain("CANCELLED");
    }
  });
});
