import { describe, expect, it } from "vitest";

import {
  orderStatusNotification,
  paymentStatusForTransition,
} from "./order-status";

describe("paymentStatusForTransition", () => {
  it.each([
    ["COMPLETED", "CASH", "COMPLETED"],
    ["COMPLETED", "ONLINE", undefined],
    ["CANCELLED", "ONLINE", "REFUNDED"],
    ["CANCELLED", "CASH", "CANCELLED"],
    ["OUT_FOR_DELIVERY", "CASH", undefined],
  ] as const)("%s paid by %s -> %s", (status, method, expected) => {
    expect(paymentStatusForTransition(status, method)).toBe(expected);
  });
});

describe("orderStatusNotification", () => {
  it.each([
    ["COMPLETED", "🎉 Order Delivered!", "SUCCESS", "successfully delivered"],
    ["CANCELLED", "❌ Order Cancelled", "ERROR", "has been cancelled"],
    [
      "OUT_FOR_DELIVERY",
      "🚀 Order Out for Delivery!",
      "SUCCESS",
      "is out for delivery",
    ],
  ] as const)("describes %s", (status, title, type, fragment) => {
    const notification = orderStatusNotification(status, "ORD-1");

    expect(notification).toMatchObject({ title, type });
    expect(notification.message).toContain("ORD-1");
    expect(notification.message).toContain(fragment);
  });

  it("uses a generic message with a readable status for other statuses", () => {
    expect(orderStatusNotification("DELIVERY_FAILED", "ORD-1")).toEqual({
      title: "Order Status Updated",
      message: "Your order with ID: ORD-1 has been updated to DELIVERY FAILED",
      type: "INFO",
    });
  });
});
