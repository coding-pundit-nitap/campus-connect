import { type PrismaMock } from "@tests/helpers";
import { buildBatch, buildOrder } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  batchRepository,
  batchService,
  notificationService,
} from "@/di/container";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  startIndividualDeliveryAction,
  verifyIndividualOrderOtpAction,
} from "./individual-delivery-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;
const notify = vi.mocked(notificationService.publishNotification);

describe("individual-delivery-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    notify.mockResolvedValue();
    db.order.updateMany.mockResolvedValue({ count: 1 });
  });

  describe("startIndividualDeliveryAction", () => {
    it("starts a RESCHEDULED order (allowed RESCHEDULED -> OUT_FOR_DELIVERY)", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "RESCHEDULED" })
      );
      await startIndividualDeliveryAction("order-1");
      expect(db.order.updateMany).toHaveBeenCalled();
    });

    it("marks the order out for delivery with a fresh OTP and notifies", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED" })
      );

      const res = await startIndividualDeliveryAction("order-1");

      const { where, data } = db.order.updateMany.mock.calls[0][0] as {
        where: object;
        data: { delivery_otp: string };
      };
      expect(where).toEqual({ id: "order-1", order_status: "BATCHED" });
      expect(data).toEqual({
        order_status: "OUT_FOR_DELIVERY",
        delivery_otp: expect.stringMatching(/^\d{4}$/),
      });
      expect(notify).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          message: expect.stringContaining(`Share OTP ${data.delivery_otp}`),
          action_url: "/orders/order-1",
        })
      );
      expect(res.details).toBe("Order marked as OUT_FOR_DELIVERY.");
    });

    it("loads the order with exactly the needed fields", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED" })
      );

      await startIndividualDeliveryAction("order-1");

      expect(db.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
        select: {
          id: true,
          shop_id: true,
          order_status: true,
          delivery_otp: true,
          user_id: true,
          display_id: true,
          batch_id: true,
          item_total: true,
        },
      });
    });

    it("sends the out-for-delivery notification payload", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED", delivery_otp: "4321" })
      );

      await startIndividualDeliveryAction("order-1");

      expect(notify).toHaveBeenCalledWith("user-1", {
        title: "🚀 Order Out for Delivery!",
        message: expect.stringContaining("Share OTP 4321"),
        type: "SUCCESS",
        category: "ORDER",
        action_url: "/orders/order-1",
      });
    });

    it("rejects a status unknown to the transition table", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "GHOST" })
      );

      await expect(startIndividualDeliveryAction("order-1")).rejects.toThrow(
        new ValidationError("This order can’t be delivered.")
      );
      expect(db.order.updateMany).not.toHaveBeenCalled();
    });

    it("reuses an existing OTP", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED", delivery_otp: "4321" })
      );

      await startIndividualDeliveryAction("order-1");

      expect(db.order.updateMany).toHaveBeenCalledWith({
        where: { id: "order-1", order_status: "BATCHED" },
        data: { order_status: "OUT_FOR_DELIVERY", delivery_otp: "4321" },
      });
      expect(batchRepository.adjustCollectiveTotal).not.toHaveBeenCalled();
    });

    it("takes a batch order out of its batch as a direct delivery", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({
          order_status: "BATCHED",
          batch_id: "batch-1",
          delivery_otp: "4321",
        })
      );
      vi.mocked(batchRepository.adjustCollectiveTotal).mockResolvedValue(
        buildBatch() as never
      );

      await startIndividualDeliveryAction("order-1");

      expect(db.order.updateMany).toHaveBeenCalledWith({
        where: { id: "order-1", order_status: "BATCHED" },
        data: {
          order_status: "OUT_FOR_DELIVERY",
          delivery_otp: "4321",
          batch_id: null,
          is_direct_delivery: true,
        },
      });
      expect(batchRepository.adjustCollectiveTotal).toHaveBeenCalledWith(
        "batch-1",
        -200,
        db
      );
      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ batchId: "batch-1" })
      );
    });

    it("rejects when the order changed after it was read", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED" })
      );
      db.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        startIndividualDeliveryAction("order-1")
      ).rejects.toBeInstanceOf(ValidationError);
      expect(notify).not.toHaveBeenCalled();
    });

    it("succeeds without notifying a guest or when notifying fails", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED", user_id: null })
      );
      await startIndividualDeliveryAction("order-1");
      expect(notify).not.toHaveBeenCalled();

      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED" })
      );
      notify.mockRejectedValue(new Error("queue"));
      await expect(
        startIndividualDeliveryAction("order-1")
      ).resolves.toMatchObject({
        success: true,
      });
    });

    it.each([[null], [buildOrder({ shop_id: "other" })]])(
      "rejects a missing or foreign order",
      async (order) => {
        db.order.findUnique.mockResolvedValue(order);

        await expect(startIndividualDeliveryAction("order-1")).rejects.toThrow(
          new UnauthorizedError("Order not found or unauthorized")
        );
      }
    );

    it.each([
      "CANCELLED",
      "COMPLETED",
      "NEW",
      "DELIVERY_FAILED",
      "OUT_FOR_DELIVERY",
    ])(
      "rejects a %s order (only statuses that may go OUT_FOR_DELIVERY)",
      async (status) => {
        db.order.findUnique.mockResolvedValue(
          buildOrder({ order_status: status })
        );

        await expect(startIndividualDeliveryAction("order-1")).rejects.toThrow(
          "This order can’t be delivered."
        );
        expect(db.order.updateMany).not.toHaveBeenCalled();
      }
    );

    it("requires a shop owner", async () => {
      auth.getOwnedShopId.mockResolvedValue("");

      await expect(
        startIndividualDeliveryAction("order-1")
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("verifyIndividualOrderOtpAction", () => {
    it("verifies the OTP through the batch service", async () => {
      vi.mocked(batchService.verifyOrderOtp).mockResolvedValue({
        success: true,
        message: "Delivered",
      } as never);

      const res = await verifyIndividualOrderOtpAction("order-1", "1234");

      expect(batchService.verifyOrderOtp).toHaveBeenCalledWith(
        "order-1",
        "1234",
        "shop-1"
      );
      expect(res.details).toBe("Delivered");
    });

    it("rejects a malformed OTP", async () => {
      await expect(
        verifyIndividualOrderOtpAction("order-1", "12")
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
