import { type PrismaMock } from "@tests/helpers";
import { buildBatch, buildUser } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { batchRepository, batchService, shopRepository } from "@/di/container";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  cancelBatchAction,
  closeBatchAction,
  forceLockBatchAction,
  updateBatchCutoffTimeAction,
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
const batches = vi.mocked(batchRepository);
const service = vi.mocked(batchService);
const db = prisma as unknown as PrismaMock;
const cutoff = new Date("2026-01-01T10:00:00.000Z");
const hoursLater = (h: number) => new Date(cutoff.getTime() + h * 3_600_000);

describe("shop batch-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserData.mockResolvedValue(buildUser() as never);
    vi.mocked(shopRepository.findByOwnerId).mockResolvedValue({
      id: "shop-1",
    } as never);
    batches.findById.mockResolvedValue(
      buildBatch({ cutoff_time: cutoff }) as never
    );
  });

  describe("updateBatchCutoffTimeAction", () => {
    it.each([3, -3, 1.5])("moves the cutoff by %s hours", async (h) => {
      const res = await updateBatchCutoffTimeAction("batch-1", hoursLater(h));

      expect(batches.update).toHaveBeenCalledWith("batch-1", {
        cutoff_time: hoursLater(h),
      });
      expect(res.details).toBe("Batch time updated successfully.");
    });

    it("rejects moving the cutoff by more than 3 hours", async () => {
      await expect(
        updateBatchCutoffTimeAction("batch-1", hoursLater(3.01))
      ).rejects.toThrow(
        new BadRequestError(
          "Batch adjustment limit is 3 hours from the original time."
        )
      );
      expect(batches.update).not.toHaveBeenCalled();
    });

    it("rejects a batch that is not open", async () => {
      batches.findById.mockResolvedValue(
        buildBatch({ status: "LOCKED" }) as never
      );

      await expect(
        updateBatchCutoffTimeAction("batch-1", cutoff)
      ).rejects.toThrow("Cannot adjust time for a closed or locked batch");
    });

    it("wraps unexpected errors", async () => {
      batches.update.mockRejectedValue(new Error("db"));

      await expect(
        updateBatchCutoffTimeAction("batch-1", cutoff)
      ).rejects.toThrow(
        new InternalServerError("Failed to update batch time.")
      );
    });
  });

  describe("closeBatchAction", () => {
    it("locks the batch, generates OTPs and opens the next batch", async () => {
      db.order.count.mockResolvedValue(0);

      const res = await closeBatchAction("batch-1");

      expect(db.order.count).toHaveBeenCalledWith({
        where: { batch_id: "batch-1", order_status: "NEW" },
      });
      expect(batches.updateStatus).toHaveBeenCalledWith("batch-1", "LOCKED");
      expect(service.generateOtpForBatch).toHaveBeenCalledWith("batch-1");
      expect(service.ensureNextOpenBatch).toHaveBeenCalledWith("shop-1");
      expect(res.details).toBe("Batch closed and locked for delivery.");
    });

    it("refuses while new orders are pending", async () => {
      db.order.count.mockResolvedValue(2);

      await expect(closeBatchAction("batch-1")).rejects.toThrow(
        new BadRequestError(
          "Accept or reject 2 new orders before closing this batch."
        )
      );
      expect(batches.updateStatus).not.toHaveBeenCalled();
    });

    it("refuses a batch that is not open", async () => {
      batches.findById.mockResolvedValue(
        buildBatch({ status: "LOCKED" }) as never
      );

      await expect(closeBatchAction("batch-1")).rejects.toThrow(
        "Batch is already closed or locked"
      );
    });

    it("wraps unexpected errors", async () => {
      db.order.count.mockRejectedValue(new Error("db"));

      await expect(closeBatchAction("batch-1")).rejects.toThrow(
        new InternalServerError("Failed to close batch.")
      );
    });
  });

  describe("forceLockBatchAction", () => {
    it("force-locks the batch for the vendor's shop", async () => {
      const res = await forceLockBatchAction("batch-1");

      expect(service.forceLockBatch).toHaveBeenCalledWith("batch-1", "shop-1");
      expect(res.details).toBe("Batch force-locked and prepared for delivery.");
    });

    it("rethrows NotFoundError from the service", async () => {
      service.forceLockBatch.mockRejectedValue(new NotFoundError("gone"));

      await expect(forceLockBatchAction("batch-1")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it("wraps unexpected errors", async () => {
      service.forceLockBatch.mockRejectedValue(new Error("db"));

      await expect(forceLockBatchAction("batch-1")).rejects.toThrow(
        new InternalServerError("Failed to force-lock batch.")
      );
    });
  });

  describe("cancelBatchAction", () => {
    it.each(["LOCKED", "IN_TRANSIT", "PENDING_REVIEW"])(
      "cancels a %s batch with the default reason",
      async (status) => {
        batches.findById.mockResolvedValue(buildBatch({ status }) as never);
        service.cancelBatch.mockResolvedValue({ cancelled_orders: 3 } as never);

        const res = await cancelBatchAction("batch-1");

        expect(service.cancelBatch).toHaveBeenCalledWith(
          "batch-1",
          "Cancelled by vendor"
        );
        expect(res.details).toBe(
          "Batch cancelled successfully. 3 orders refunded."
        );
      }
    );

    it("passes a custom reason", async () => {
      batches.findById.mockResolvedValue(
        buildBatch({ status: "LOCKED" }) as never
      );
      service.cancelBatch.mockResolvedValue({ cancelled_orders: 0 } as never);

      await cancelBatchAction("batch-1", "Rain");

      expect(service.cancelBatch).toHaveBeenCalledWith("batch-1", "Rain");
    });

    it("refuses an open batch", async () => {
      await expect(cancelBatchAction("batch-1")).rejects.toThrow(
        "Can only cancel LOCKED, IN_TRANSIT, or PENDING_REVIEW batches"
      );
    });

    it("wraps unexpected errors", async () => {
      batches.findById.mockRejectedValue(new Error("db"));

      await expect(cancelBatchAction("batch-1")).rejects.toThrow(
        new InternalServerError("Failed to cancel batch.")
      );
    });
  });

  describe.each([
    [
      "updateBatchCutoffTimeAction",
      () => updateBatchCutoffTimeAction("batch-1", cutoff),
    ],
    ["closeBatchAction", () => closeBatchAction("batch-1")],
    ["forceLockBatchAction", () => forceLockBatchAction("batch-1")],
    ["cancelBatchAction", () => cancelBatchAction("batch-1")],
  ])("%s guards", (_name, act) => {
    it("rejects a session without a user id", async () => {
      auth.getUserData.mockResolvedValue(buildUser({ id: "" }) as never);

      await expect(act()).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects a user without a shop", async () => {
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null);

      await expect(act()).rejects.toThrow(
        new BadRequestError("Shop not found")
      );
    });
  });

  describe.each([
    [
      "updateBatchCutoffTimeAction",
      () => updateBatchCutoffTimeAction("batch-1", cutoff),
    ],
    ["closeBatchAction", () => closeBatchAction("batch-1")],
    ["cancelBatchAction", () => cancelBatchAction("batch-1")],
  ])("%s batch ownership", (_name, act) => {
    it.each([null, buildBatch({ shop_id: "other" })])(
      "rejects a missing or foreign batch (%o)",
      async (found) => {
        batches.findById.mockResolvedValue(found as never);

        await expect(act()).rejects.toThrow(
          new BadRequestError("Batch not found or unauthorized")
        );
      }
    );
  });
});
