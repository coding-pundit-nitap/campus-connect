import { describe, expect, it } from "vitest";

import { paymentStatusForTransition } from "./order-status";

describe("payment follows the order (order-status)", () => {
  it("RULE O27: completing a CASH order marks the cash COMPLETED; ONLINE is left as is", () => {
    expect(paymentStatusForTransition("COMPLETED", "CASH")).toBe("COMPLETED");
    expect(paymentStatusForTransition("COMPLETED", "ONLINE")).toBeUndefined();
  });

  it("RULE O30: cancelling a paid order refunds it, whatever the method", () => {
    expect(paymentStatusForTransition("CANCELLED", "ONLINE", "COMPLETED")).toBe(
      "REFUNDED"
    );
    expect(paymentStatusForTransition("CANCELLED", "CASH", "COMPLETED")).toBe(
      "REFUNDED"
    );
  });

  it("RULE O30: cancelling an unpaid CASH order cancels the payment", () => {
    expect(paymentStatusForTransition("CANCELLED", "CASH", "PENDING")).toBe(
      "CANCELLED"
    );
    expect(paymentStatusForTransition("CANCELLED", "CASH")).toBe("CANCELLED");
  });

  it("other transitions leave the payment status untouched", () => {
    for (const s of [
      "NEW",
      "BATCHED",
      "OUT_FOR_DELIVERY",
      "DELIVERY_FAILED",
      "RESCHEDULED",
    ] as const) {
      expect(paymentStatusForTransition(s, "CASH", "PENDING")).toBeUndefined();
    }
  });
});
