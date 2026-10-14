import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { batchService } from "@/di/container";
import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  cancelBatchAction,
  completeBatchAction,
  lockBatchAction,
  startBatchDeliveryAction,
  unlockBatchAction,
  updateBatchMilestoneAction,
  verifyOrderOtpAction,
} from "./batch-actions";

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
const service = vi.mocked(batchService);
const db = prisma as unknown as PrismaMock;

describe("vendor batch-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getOwnedShopId.mockResolvedValue("shop-1");
    db.batch.findUnique.mockResolvedValue({ shop_id: "shop-1" });
  });

  it("lockBatchAction locks the batch for the owner's shop", async () => {
    const res = await lockBatchAction("batch-1");

    expect(service.lockBatch).toHaveBeenCalledWith("batch-1", "shop-1");
    expect(res.details).toBe("Batch locked. Orders are now in PREP MODE.");
  });

  it.each([
    [
      "startBatchDeliveryAction",
      startBatchDeliveryAction,
      "startDelivery",
      "Delivery started. Orders marked as OUT_FOR_DELIVERY.",
    ],
    [
      "unlockBatchAction",
      unlockBatchAction,
      "unlockBatch",
      "Batch unlocked. Orders moved back to PREP MODE.",
    ],
    [
      "completeBatchAction",
      completeBatchAction,
      "completeBatch",
      "Batch completed.",
    ],
  ] as const)(
    "%s delegates to batchService.%s",
    async (_n, action, method, details) => {
      const res = await action("batch-1");

      expect(db.batch.findUnique).toHaveBeenCalledWith({
        where: { id: "batch-1" },
        select: { shop_id: true },
      });
      expect(service[method]).toHaveBeenCalledWith("batch-1");
      expect(res.details).toBe(details);
    }
  );

  describe("cancelBatchAction", () => {
    it.each([
      [undefined, "Vendor cancelled"],
      ["Rain", "Rain"],
    ])("cancels with reason %j", async (reason, expected) => {
      service.cancelBatch.mockResolvedValue({ cancelled_orders: 2 } as never);

      const res = await cancelBatchAction("batch-1", reason);

      expect(service.cancelBatch).toHaveBeenCalledWith("batch-1", expected);
      expect(res.details).toBe("Batch cancelled. 2 orders affected.");
    });
  });

  describe("verifyOrderOtpAction", () => {
    it("returns the service message on success", async () => {
      service.verifyOrderOtp.mockResolvedValue({
        success: true,
        message: "Delivered",
      } as never);

      const res = await verifyOrderOtpAction("order-1", "1234");

      expect(service.verifyOrderOtp).toHaveBeenCalledWith(
        "order-1",
        "1234",
        "shop-1"
      );
      expect(res).toMatchObject({ success: true, details: "Delivered" });
    });

    it("throws the service message as a ValidationError on failure", async () => {
      service.verifyOrderOtp.mockResolvedValue({
        success: false,
        message: "Wrong OTP",
      } as never);

      await expect(verifyOrderOtpAction("order-1", "1234")).rejects.toThrow(
        new ValidationError("Wrong OTP")
      );
    });

    it.each(["", "123", 1234])("rejects the OTP %j", async (otp) => {
      await expect(
        verifyOrderOtpAction("order-1", otp as string)
      ).rejects.toThrow(
        new ValidationError("Invalid OTP format. Must be 4 digits.")
      );
      expect(service.verifyOrderOtp).not.toHaveBeenCalled();
    });
  });

  it("updateBatchMilestoneAction forwards the rider details", async () => {
    const eta = new Date();

    const res = await updateBatchMilestoneAction({
      batchId: "batch-1",
      milestone: "PICKED_UP" as never,
      riderName: "Ravi",
      riderPhone: "999",
      estimatedArrival: eta,
    });

    expect(service.updateBatchMilestone).toHaveBeenCalledWith(
      "batch-1",
      "PICKED_UP",
      "Ravi",
      "999",
      eta
    );
    expect(res.details).toBe("Batch milestone updated successfully.");
  });

  const all = [
    ["lockBatchAction", () => lockBatchAction("batch-1")],
    ["startBatchDeliveryAction", () => startBatchDeliveryAction("batch-1")],
    ["unlockBatchAction", () => unlockBatchAction("batch-1")],
    ["completeBatchAction", () => completeBatchAction("batch-1")],
    ["cancelBatchAction", () => cancelBatchAction("batch-1")],
    ["verifyOrderOtpAction", () => verifyOrderOtpAction("o", "1234")],
    [
      "updateBatchMilestoneAction",
      () =>
        updateBatchMilestoneAction({
          batchId: "batch-1",
          milestone: "PICKED_UP" as never,
        }),
    ],
  ] as const;

  it.each(all)("%s requires a shop owner", async (_n, act) => {
    auth.getOwnedShopId.mockResolvedValue("");

    await expect(act()).rejects.toThrow(
      new UnauthorizedError("Unauthorized: You do not own a shop.")
    );
  });

  describe.each(
    all.filter(
      ([n]) => !["lockBatchAction", "verifyOrderOtpAction"].includes(n)
    )
  )("%s batch ownership", (_n, act) => {
    it.each([[null], [{ shop_id: "other" }]])(
      "rejects a missing or foreign batch %o",
      async (found) => {
        db.batch.findUnique.mockResolvedValue(found);

        await expect(act()).rejects.toThrow(
          new ValidationError("Batch not found or unauthorized")
        );
      }
    );
  });
});
