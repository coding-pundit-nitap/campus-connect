import { type PrismaMock } from "@tests/helpers";
import {
  buildBatch,
  buildOrder,
  buildUser,
} from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchRepository,
  batchService,
  notificationService,
  orderRepository,
  shopRepository,
} from "@/di/container";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  acceptOrderAction,
  markDeliveryFailedAction,
  rejectOrderAction,
  startDirectDeliveryAction,
  verifyDeliveryOtpAction,
} from "./order-management-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));

const auth = vi.mocked(authUtils);
const orders = vi.mocked(orderRepository);
const notify = vi.mocked(notificationService.publishNotification);
const db = prisma as unknown as PrismaMock;

const givenOrder = (overrides: Record<string, unknown> = {}) =>
  orders.getOrderById.mockResolvedValue(buildOrder(overrides) as never);

describe("order-management-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserData.mockResolvedValue(buildUser() as never);
    vi.mocked(shopRepository.findByOwnerId).mockResolvedValue({
      id: "shop-1",
    } as never);
    notify.mockResolvedValue();
  });

  describe("acceptOrderAction", () => {
    beforeEach(() => {
      vi.mocked(batchService.getNextSlot).mockResolvedValue({
        batch_id: "batch-2",
      } as never);
    });

    it("batches an unbatched order and notifies the customer", async () => {
      givenOrder();

      const res = await acceptOrderAction("order-1");

      expect(db.$queryRaw).not.toHaveBeenCalled();
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { order_status: "BATCHED" },
      });
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "✅ Order Accepted",
        message:
          "Your order ORD-1 has been accepted by the shop and is being prepared.",
        type: "SUCCESS",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.details).toBe("Order accepted successfully.");
    });

    it.each([[[{ id: "batch-1", status: "OPEN" }]], [[]], [undefined]])(
      "keeps the order in its batch when the batch is still open (%o)",
      async (rows) => {
        givenOrder({ batch_id: "batch-1" });
        db.$queryRaw.mockResolvedValue(rows);

        await acceptOrderAction("order-1");

        expect(db.order.update).toHaveBeenCalledWith({
          where: { id: "order-1" },
          data: { order_status: "BATCHED" },
        });
        const [strings, ...values] = db.$queryRaw.mock.calls[0] as [
          string[],
          ...unknown[],
        ];
        expect(strings.join("?")).toContain(
          'SELECT id, status FROM "Batch" WHERE id = ?'
        );
        expect(strings.join("?")).toContain("FOR UPDATE");
        expect(values).toEqual(["batch-1"]);
      }
    );

    it("moves the order to the next batch when its batch already closed", async () => {
      givenOrder({ batch_id: "batch-1", customer_notes: "Ring bell" });
      db.$queryRaw.mockResolvedValue([{ id: "batch-1", status: "LOCKED" }]);

      const res = await acceptOrderAction("order-1");

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          order_status: "RESCHEDULED",
          batch: { connect: { id: "batch-2" } },
          customer_notes:
            "Ring bell\n[Moved to next batch due to missed cutoff]",
        },
      });
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "🕒 Order Rescheduled",
        message:
          "Your order ORD-1 missed the batch cutoff and has been moved to the next available batch.",
        type: "WARNING",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.details).toBe(
        "Order accepted and rescheduled (missed cutoff)."
      );
    });

    it("converts the order to direct delivery when there is no next batch", async () => {
      givenOrder({ batch_id: "batch-1" });
      db.$queryRaw.mockResolvedValue([{ id: "batch-1", status: "LOCKED" }]);
      vi.mocked(batchService.getNextSlot).mockResolvedValue({
        batch_id: null,
      } as never);

      await acceptOrderAction("order-1");

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          order_status: "RESCHEDULED",
          batch: { disconnect: true },
          is_direct_delivery: true,
          customer_notes:
            "[Auto-converted to Direct Delivery due to missed batch]",
        },
      });
      expect(notify).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          title: "🕒 Order Rescheduled",
          message:
            "Your order ORD-1 missed the batch cutoff and has been upgraded to Direct Delivery for free!",
          type: "WARNING",
        })
      );
    });

    it("appends the direct-delivery note to existing notes", async () => {
      givenOrder({ batch_id: "batch-1", customer_notes: "Gate 2" });
      db.$queryRaw.mockResolvedValue([{ id: "batch-1", status: "LOCKED" }]);
      vi.mocked(batchService.getNextSlot).mockResolvedValue({
        batch_id: null,
      } as never);

      await acceptOrderAction("order-1");

      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customer_notes:
              "Gate 2\n[Auto-converted to Direct Delivery due to missed batch]",
          }),
        })
      );
    });

    it("succeeds without notifying guest orders or when notifying fails", async () => {
      givenOrder({ user_id: null });
      await acceptOrderAction("order-1");
      expect(notify).not.toHaveBeenCalled();

      givenOrder();
      notify.mockRejectedValue(new Error("queue"));
      await expect(acceptOrderAction("order-1")).resolves.toMatchObject({
        success: true,
      });
    });

    it("rejects an order that is not NEW", async () => {
      givenOrder({ order_status: "BATCHED" });

      await expect(acceptOrderAction("order-1")).rejects.toThrow(
        new BadRequestError("Cannot accept order with status BATCHED")
      );
    });
  });

  describe("startDirectDeliveryAction", () => {
    it("starts delivery with a new 4-digit OTP", async () => {
      givenOrder({ is_direct_delivery: true, order_status: "BATCHED" });

      const res = await startDirectDeliveryAction("order-1");

      const [, data] = orders.update.mock.calls[0] as [
        string,
        { delivery_otp: string },
      ];
      expect(data).toEqual({
        order_status: "OUT_FOR_DELIVERY",
        delivery_otp: expect.stringMatching(/^\d{4}$/),
      });
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "🚀 Order Out for Delivery!",
        message: `Your order ORD-1 is out for delivery. Share OTP ${data.delivery_otp} to complete delivery.`,
        type: "SUCCESS",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.details).toBe("Direct delivery started.");
    });

    it("reuses an existing OTP", async () => {
      givenOrder({
        is_direct_delivery: true,
        order_status: "BATCHED",
        delivery_otp: "4321",
      });

      await startDirectDeliveryAction("order-1");

      expect(orders.update).toHaveBeenCalledWith("order-1", {
        order_status: "OUT_FOR_DELIVERY",
        delivery_otp: "4321",
      });
    });

    it("rejects a batched (non-direct) order", async () => {
      givenOrder({ order_status: "BATCHED" });

      await expect(startDirectDeliveryAction("order-1")).rejects.toThrow(
        new BadRequestError("This order is not a direct delivery.")
      );
    });

    it("rejects an order that is not BATCHED", async () => {
      givenOrder({ is_direct_delivery: true });

      await expect(startDirectDeliveryAction("order-1")).rejects.toThrow(
        "Cannot start delivery for order with status NEW"
      );
    });
  });

  describe("rejectOrderAction", () => {
    it("cancels and refunds an online order with the reason noted", async () => {
      givenOrder({ payment_method: "ONLINE", customer_notes: "Hi" });

      const res = await rejectOrderAction("order-1", "Out of stock");

      expect(orders.updateIfStatus).toHaveBeenCalledWith(
        "order-1",
        "NEW",
        {
          order_status: "CANCELLED",
          payment_status: "REFUNDED",
          cancellation_reason: "Out of stock",
          customer_notes: "Hi\n[Vendor Rejected: Out of stock]",
        },
        db
      );
      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
      expect(publishBatchProgress).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "❌ Order Rejected by Vendor",
        message:
          "Your order ORD-1 was rejected by the shop. A refund has been initiated if you paid online.",
        type: "ERROR",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.details).toBe("Order rejected successfully.");
    });

    it("cancels a cash order without a reason and updates its batch", async () => {
      givenOrder({ batch_id: "batch-1" });
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue(
        buildBatch() as never
      );

      await rejectOrderAction("order-1");

      expect(orders.updateIfStatus).toHaveBeenCalledWith(
        "order-1",
        "NEW",
        expect.objectContaining({
          payment_status: "CANCELLED",
          cancellation_reason: null,
          customer_notes: "[Vendor Rejected]",
        }),
        db
      );
      expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
        "batch-1",
        -200,
        db
      );
      expect(orders.restoreStock).toHaveBeenCalledWith(["order-1"], db);
      expect(publishBatchProgress).toHaveBeenCalledTimes(1);
    });

    it("refunds a cash order whose payment was already collected", async () => {
      givenOrder({ payment_method: "CASH", payment_status: "COMPLETED" });

      await rejectOrderAction("order-1");

      expect(orders.updateIfStatus).toHaveBeenCalledWith(
        "order-1",
        "NEW",
        expect.objectContaining({ payment_status: "REFUNDED" }),
        db
      );
    });

    it.each(["COMPLETED", "CANCELLED"])(
      "refuses a %s order",
      async (status) => {
        givenOrder({ order_status: status });

        await expect(rejectOrderAction("order-1")).rejects.toThrow(
          `Cannot reject order with status ${status}`
        );
      }
    );
  });

  describe("verifyDeliveryOtpAction", () => {
    it("completes a cash order and marks it paid", async () => {
      givenOrder({ order_status: "OUT_FOR_DELIVERY", delivery_otp: "1234" });

      const res = await verifyDeliveryOtpAction("order-1", "1234");

      expect(orders.update).toHaveBeenCalledWith("order-1", {
        order_status: "COMPLETED",
        actual_delivery_time: expect.any(Date),
        delivery_otp: null,
        payment_status: "COMPLETED",
      });
      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "🎉 Order Delivered!",
        message: "Your order ORD-1 was successfully delivered. Thank you!",
        type: "SUCCESS",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
      expect(res.details).toBe("OTP verified and order completed.");
    });

    it("keeps the payment status of an online order", async () => {
      givenOrder({
        order_status: "OUT_FOR_DELIVERY",
        delivery_otp: "1234",
        payment_method: "ONLINE",
        payment_status: "PENDING",
      });

      await verifyDeliveryOtpAction("order-1", "1234");

      expect(orders.update).toHaveBeenCalledWith(
        "order-1",
        expect.objectContaining({ payment_status: "PENDING" })
      );
    });

    it.each([
      [
        { order_status: "BATCHED" },
        "1234",
        "Order is not in a valid state for delivery.",
      ],
      [{ order_status: "OUT_FOR_DELIVERY" }, "", "OTP must be 4 digits."],
      [{ order_status: "OUT_FOR_DELIVERY" }, "123", "OTP must be 4 digits."],
      [
        { order_status: "OUT_FOR_DELIVERY", delivery_otp: "9999" },
        "1234",
        "Invalid OTP provided.",
      ],
    ])("rejects %o with OTP %j", async (order, otp, message) => {
      givenOrder(order);

      await expect(verifyDeliveryOtpAction("order-1", otp)).rejects.toThrow(
        new BadRequestError(message)
      );
      expect(orders.update).not.toHaveBeenCalled();
    });
  });

  describe("markDeliveryFailedAction", () => {
    it.each([
      ["No answer", null, "[Delivery Failed: No answer]"],
      ["", "Gate 2", "Gate 2\n[Delivery Failed]"],
    ])(
      "records the failure (reason %j, notes %j)",
      async (reason, notes, expected) => {
        givenOrder({ order_status: "OUT_FOR_DELIVERY", customer_notes: notes });

        const res = await markDeliveryFailedAction("order-1", reason);

        expect(orders.update).toHaveBeenCalledWith("order-1", {
          order_status: "DELIVERY_FAILED",
          customer_notes: expected,
        });
        expect(notify).toHaveBeenCalledWith("user-1", {
          title: "⚠️ Delivery Failed",
          message:
            "The runner was unable to deliver your order ORD-1. Please contact the shop immediately.",
          type: "ERROR",
          category: "ORDER",
          action_url: "/orders/order-1",
        });
        expect(res.details).toBe("Order marked as delivery failed.");
      }
    );

    it("refuses an order that is not out for delivery", async () => {
      givenOrder();

      await expect(markDeliveryFailedAction("order-1", "x")).rejects.toThrow(
        "Cannot mark failed for order with status NEW"
      );
    });
  });

  describe.each([
    [
      "acceptOrderAction",
      () => acceptOrderAction("order-1"),
      "Failed to accept order.",
    ],
    [
      "startDirectDeliveryAction",
      () => startDirectDeliveryAction("order-1"),
      "Failed to start direct delivery.",
    ],
    [
      "rejectOrderAction",
      () => rejectOrderAction("order-1"),
      "Failed to reject order.",
    ],
    [
      "verifyDeliveryOtpAction",
      () => verifyDeliveryOtpAction("order-1", "1234"),
      "Failed to verify OTP.",
    ],
    [
      "markDeliveryFailedAction",
      () => markDeliveryFailedAction("order-1", "x"),
      "Failed to mark delivery failed.",
    ],
  ])("%s guards", (_name, act, fallback) => {
    it("rejects a session without a user id", async () => {
      auth.getUserData.mockResolvedValue(buildUser({ id: "" }) as never);

      await expect(act()).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects a user without a shop", async () => {
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null);

      await expect(act()).rejects.toThrow(
        new UnauthorizedError("You don't own a shop.")
      );
    });

    it.each([null, buildOrder({ shop_id: "other" })])(
      "rejects a missing or foreign order (%o)",
      async (found) => {
        orders.getOrderById.mockResolvedValue(found as never);

        await expect(act()).rejects.toThrow(
          new UnauthorizedError("Order not found or unauthorized")
        );
      }
    );

    it("wraps unexpected errors", async () => {
      orders.getOrderById.mockRejectedValue(new Error("db"));

      await expect(act()).rejects.toThrow(new InternalServerError(fallback));
    });
  });
});
