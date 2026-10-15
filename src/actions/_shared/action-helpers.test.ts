import { buildBatch, buildUser } from "@tests/helpers/actions-user/builders";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notificationService, shopRepository } from "@/di/container";
import { publishBatchProgress } from "@/lib/batch-progress-publisher";
import {
  InternalServerError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils.server";

import {
  AUTH_ERRORS,
  generateDeliveryOtp,
  notifyUserSafely,
  publishBatchRowProgress,
  requireOwnedShopId,
  requireUserId,
  requireVendorShopId,
  runAction,
} from "./action-helpers";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers")).mockModule()
);
vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/batch-progress-publisher", () => ({
  publishBatchProgress: vi.fn(),
}));

const auth = vi.mocked(authUtils);
const log = { error: vi.fn() };
const policy = { label: "LABEL", fallback: "Fallback message" };

describe("action-helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("runAction", () => {
    it("returns the result of the wrapped function", async () => {
      await expect(runAction(log, policy, async () => 42)).resolves.toBe(42);
      expect(log.error).not.toHaveBeenCalled();
    });

    it("rethrows errors whose class is listed in passthrough", async () => {
      const error = new NotFoundError("missing");

      await expect(
        runAction(log, { ...policy, passthrough: [NotFoundError] }, () =>
          Promise.reject(error)
        )
      ).rejects.toBe(error);
      expect(log.error).toHaveBeenCalledWith({ err: error }, "LABEL");
    });

    it("wraps any other error in an InternalServerError with the fallback message", async () => {
      const promise = runAction(log, policy, () =>
        Promise.reject(new UnauthorizedError("nope"))
      );

      await expect(promise).rejects.toBeInstanceOf(InternalServerError);
      await expect(promise).rejects.toThrow("Fallback message");
    });

    it("exposes the auth errors most actions pass through", () => {
      expect(AUTH_ERRORS).toEqual([UnauthorizedError, UnauthenticatedError]);
    });
  });

  describe("requireUserId", () => {
    it("returns the session user id", async () => {
      auth.getUserId.mockResolvedValue("user-1");

      await expect(requireUserId()).resolves.toBe("user-1");
    });

    it("throws UnauthorizedError with the default message when there is no user", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(requireUserId()).rejects.toThrow(
        new UnauthorizedError("Unauthorized: Please log in.")
      );
    });

    it("uses the custom message when given", async () => {
      auth.getUserId.mockResolvedValue("");

      await expect(requireUserId("custom")).rejects.toThrow("custom");
    });
  });

  describe("requireOwnedShopId", () => {
    it("returns the owned shop id", async () => {
      auth.getOwnedShopId.mockResolvedValue("shop-1");

      await expect(requireOwnedShopId()).resolves.toBe("shop-1");
    });

    it("throws UnauthorizedError when the user owns no shop", async () => {
      auth.getOwnedShopId.mockResolvedValue("");

      await expect(requireOwnedShopId()).rejects.toThrow(
        new UnauthorizedError("Unauthorized: You do not own a shop.")
      );
    });
  });

  describe("requireVendorShopId", () => {
    it("returns the id of the shop owned by the current user", async () => {
      auth.getUserData.mockResolvedValue(buildUser() as never);
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue({
        id: "shop-9",
      } as never);

      await expect(requireVendorShopId()).resolves.toBe("shop-9");
      expect(shopRepository.findByOwnerId).toHaveBeenCalledWith("user-1", {
        select: { id: true },
      });
    });

    it("throws UnauthorizedError when the session has no user id", async () => {
      auth.getUserData.mockResolvedValue(buildUser({ id: "" }) as never);

      await expect(requireVendorShopId()).rejects.toThrow(
        new UnauthorizedError("Not authorized")
      );
    });

    it("throws BadRequestError when the user owns no shop", async () => {
      auth.getUserData.mockResolvedValue(buildUser() as never);
      vi.mocked(shopRepository.findByOwnerId).mockResolvedValue(null);

      await expect(requireVendorShopId()).rejects.toThrow(
        new UnauthorizedError("You don't own a shop.")
      );
    });
  });

  describe("notifyUserSafely", () => {
    const payload = { title: "T", message: "M" };

    it("publishes the notification to the user", async () => {
      await notifyUserSafely(log, "user-1", payload, "NOTIFY");

      expect(notificationService.publishNotification).toHaveBeenCalledWith(
        "user-1",
        payload
      );
    });

    it("does nothing without a user id", async () => {
      await notifyUserSafely(log, null, payload, "NOTIFY");

      expect(notificationService.publishNotification).not.toHaveBeenCalled();
    });

    it("logs and swallows publishing failures", async () => {
      const error = new Error("queue down");
      vi.mocked(notificationService.publishNotification).mockRejectedValue(
        error
      );

      await expect(
        notifyUserSafely(log, "user-1", payload, "NOTIFY")
      ).resolves.toBeUndefined();
      expect(log.error).toHaveBeenCalledWith({ err: error }, "NOTIFY");
    });
  });

  describe("publishBatchRowProgress", () => {
    it("publishes the batch progress with numeric totals", async () => {
      await publishBatchRowProgress(
        buildBatch({
          collective_total: "120.5",
          min_order_value_snapshot: "80",
        })
      );

      expect(publishBatchProgress).toHaveBeenCalledWith({
        batchId: "batch-1",
        shopId: "shop-1",
        status: "OPEN",
        collectiveTotal: 120.5,
        minRequired: 80,
      });
    });

    it("publishes a null minimum when the batch has no snapshot", async () => {
      await publishBatchRowProgress(
        buildBatch({ min_order_value_snapshot: null })
      );

      expect(publishBatchProgress).toHaveBeenCalledWith(
        expect.objectContaining({ minRequired: null })
      );
    });

    it("does nothing without a batch", async () => {
      await publishBatchRowProgress(null);

      expect(publishBatchProgress).not.toHaveBeenCalled();
    });
  });

  describe("generateDeliveryOtp", () => {
    it("returns a 4-digit code", () => {
      for (let i = 0; i < 50; i++) {
        expect(generateDeliveryOtp()).toMatch(/^[1-9]\d{3}$/);
      }
    });
  });
});
