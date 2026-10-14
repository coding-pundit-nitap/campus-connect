import { type PrismaMock } from "@tests/helpers";
import { buildOrder } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { batchService, notificationService } from "@/di/container";
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
  });

  describe("startIndividualDeliveryAction", () => {
    it("marks the order out for delivery with a fresh OTP and notifies", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ order_status: "BATCHED" })
      );

      const res = await startIndividualDeliveryAction("order-1");

      const { data } = db.order.update.mock.calls[0][0] as {
        data: { delivery_otp: string };
      };
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

    it("reuses an existing OTP", async () => {
      db.order.findUnique.mockResolvedValue(
        buildOrder({ delivery_otp: "4321" })
      );

      await startIndividualDeliveryAction("order-1");

      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { order_status: "OUT_FOR_DELIVERY", delivery_otp: "4321" },
      });
    });

    it("succeeds without notifying a guest or when notifying fails", async () => {
      db.order.findUnique.mockResolvedValue(buildOrder({ user_id: null }));
      await startIndividualDeliveryAction("order-1");
      expect(notify).not.toHaveBeenCalled();

      db.order.findUnique.mockResolvedValue(buildOrder());
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
          new ValidationError("Order not found or unauthorized")
        );
      }
    );

    it.each(["CANCELLED", "COMPLETED"])(
      "rejects a %s order",
      async (status) => {
        db.order.findUnique.mockResolvedValue(
          buildOrder({ order_status: status })
        );

        await expect(startIndividualDeliveryAction("order-1")).rejects.toThrow(
          "This order can’t be delivered."
        );
        expect(db.order.update).not.toHaveBeenCalled();
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
