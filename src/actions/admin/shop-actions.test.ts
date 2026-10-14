import type { PrismaMock } from "@tests/helpers";
import {
  ADMIN_ID,
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
  rows,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  auditService,
  container,
  fileUploadService,
  notificationService,
} from "@/di/container";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/custom-error";

import {
  activateShopAction,
  deactivateShopAction,
  deleteShopAction,
  getAllShopsAction,
  getShopStatsAction,
  updateShopVerificationAction,
} from "./shop-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const shops = vi.mocked(container.shopRepository);
const carts = vi.mocked(container.cartRepository);
const db = container.db as unknown as PrismaMock;
const notify = vi.mocked(notificationService.publishNotification);

const shop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "shop-1",
    name: "Cafe",
    description: "desc",
    location: "loc",
    is_active: true,
    verification_status: "PENDING",
    created_at: new Date("2026-01-01"),
    image_key: null,
    qr_image_key: null,
    user: { id: "owner-1" },
    ...overrides,
  }) as never;

describe("admin shop actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllShopsAction", () => {
    itGuardsAdminAccess(
      () => getAllShopsAction({ limit: 10 }),
      "Failed to retrieve shops."
    );

    it("returns mapped shops without filters", async () => {
      shops.findMany.mockResolvedValue([
        { ...(shop() as object), extra: "dropped" },
      ] as never);

      const res = await getAllShopsAction({ limit: 10 });

      expect(shops.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 11, skip: 0 })
      );
      expect(res.data?.data).toEqual([
        {
          id: "shop-1",
          name: "Cafe",
          description: "desc",
          location: "loc",
          is_active: true,
          verification_status: "PENDING",
          created_at: new Date("2026-01-01"),
          user: { id: "owner-1" },
        },
      ]);
      expect(res.data?.hasMore).toBe(false);
    });

    it("applies search, is_active, verification status and cursor", async () => {
      shops.findMany.mockResolvedValue(rows(2, "s") as never);

      const res = await getAllShopsAction({
        limit: 1,
        cursor: CURSOR,
        search: "caf",
        is_active: false,
        verification_status: "VERIFIED",
      });

      expect(shops.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "caf", mode: "insensitive" } },
              { description: { contains: "caf", mode: "insensitive" } },
              { location: { contains: "caf", mode: "insensitive" } },
            ],
            is_active: false,
            verification_status: "VERIFIED",
          },
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.nextCursor).toBe("s-1");
    });

    it("rejects invalid options without querying", async () => {
      await expect(getAllShopsAction({ limit: 0 })).rejects.toThrow(
        BadRequestError
      );
      expect(shops.findMany).not.toHaveBeenCalled();
    });
  });

  describe("activateShopAction", () => {
    itGuardsAdminAccess(
      () => activateShopAction("shop-1"),
      "Failed to activate shop."
    );

    it("activates, notifies the owner and audits", async () => {
      shops.findById.mockResolvedValue(shop({ is_active: false }));
      shops.update.mockResolvedValue(shop({ is_active: true }));

      const res = await activateShopAction("shop-1");

      expect(shops.update).toHaveBeenCalledWith("shop-1", { is_active: true });
      expect(notify).toHaveBeenCalledWith(
        "owner-1",
        expect.objectContaining({ title: "Shop Activated" })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "SHOP_ACTIVATE",
        "SHOP",
        "shop-1",
        { shop_name: "Cafe" }
      );
      expect(res.data).toEqual({ id: "shop-1", name: "Cafe", is_active: true });
    });

    it("rejects a blank id", async () => {
      await expect(activateShopAction(" ")).rejects.toThrow(BadRequestError);
      expect(shops.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown shop", async () => {
      shops.findById.mockResolvedValue(null);

      await expect(activateShopAction("shop-1")).rejects.toThrow(NotFoundError);
    });

    it("forbids activating an active shop", async () => {
      shops.findById.mockResolvedValue(shop());

      await expect(activateShopAction("shop-1")).rejects.toThrow(
        "Shop is already active"
      );
    });
  });

  describe("deactivateShopAction", () => {
    itGuardsAdminAccess(
      () => deactivateShopAction("shop-1"),
      "Failed to deactivate shop."
    );

    it("clears non-empty carts, notifies affected users and the owner", async () => {
      shops.findById.mockResolvedValue(shop());
      carts.findMany.mockResolvedValue([
        { id: "c1", items: [{ id: "i1" }], user: { id: "u1" } },
        { id: "c2", items: [], user: { id: "u2" } },
      ] as never);
      shops.update.mockResolvedValue(shop({ is_active: false }));

      const res = await deactivateShopAction("shop-1");

      expect(db.cartItem.deleteMany).toHaveBeenCalledTimes(1);
      expect(db.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "c1" },
      });
      expect(notify).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({ title: "Cart Items Removed" })
      );
      expect(notify).not.toHaveBeenCalledWith("u2", expect.anything());
      expect(notify).toHaveBeenCalledWith(
        "owner-1",
        expect.objectContaining({ title: "Shop Deactivated" })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "SHOP_DEACTIVATE",
        "SHOP",
        "shop-1",
        { shop_name: "Cafe", affected_users: 1 }
      );
      expect(res.data?.is_active).toBe(false);
      expect(res.details).toContain("1 user carts were cleared");
    });

    it("still deactivates when a cart notification fails", async () => {
      shops.findById.mockResolvedValue(shop());
      carts.findMany.mockResolvedValue([
        { id: "c1", items: [{ id: "i1" }], user: { id: "u1" } },
      ] as never);
      notify.mockRejectedValueOnce(new Error("push down"));
      shops.update.mockResolvedValue(shop({ is_active: false }));

      const res = await deactivateShopAction("shop-1");

      expect(res.success).toBe(true);
    });

    it("rejects a blank id", async () => {
      await expect(deactivateShopAction("")).rejects.toThrow(BadRequestError);
    });

    it("throws NotFoundError for an unknown shop", async () => {
      shops.findById.mockResolvedValue(null);

      await expect(deactivateShopAction("shop-1")).rejects.toThrow(
        NotFoundError
      );
    });

    it("forbids deactivating an inactive shop", async () => {
      shops.findById.mockResolvedValue(shop({ is_active: false }));

      await expect(deactivateShopAction("shop-1")).rejects.toThrow(
        "Shop is already inactive"
      );
    });
  });

  describe("deleteShopAction", () => {
    itGuardsAdminAccess(
      () => deleteShopAction("shop-1"),
      "Failed to delete shop."
    );

    it("deletes images, disconnects the owner, deletes and notifies", async () => {
      shops.findById.mockResolvedValue(
        shop({ image_key: "img", qr_image_key: "qr" })
      );
      vi.mocked(fileUploadService.deleteFile).mockResolvedValue(undefined);

      const res = await deleteShopAction("shop-1");

      expect(fileUploadService.deleteFile).toHaveBeenCalledWith("img");
      expect(fileUploadService.deleteFile).toHaveBeenCalledWith("qr");
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "owner-1" },
        data: { owned_shop: { disconnect: true } },
      });
      expect(db.shop.delete).toHaveBeenCalledWith({ where: { id: "shop-1" } });
      expect(notify).toHaveBeenCalledWith(
        "owner-1",
        expect.objectContaining({ title: "Shop Deleted" })
      );
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "SHOP_DELETE",
        "SHOP",
        "shop-1",
        { shop_name: "Cafe", owner_id: "owner-1" }
      );
      expect(res.data).toEqual({ id: "shop-1", name: "Cafe" });
    });

    it("tolerates image deletion and notification failures", async () => {
      shops.findById.mockResolvedValue(
        shop({ image_key: "img", qr_image_key: "qr" })
      );
      vi.mocked(fileUploadService.deleteFile).mockRejectedValue(
        new Error("s3 down")
      );
      notify.mockRejectedValueOnce(new Error("push down"));

      const res = await deleteShopAction("shop-1");

      expect(res.success).toBe(true);
      expect(db.shop.delete).toHaveBeenCalled();
    });

    it("deletes an ownerless shop without touching users", async () => {
      shops.findById.mockResolvedValue(shop({ user: null }));

      await deleteShopAction("shop-1");

      expect(fileUploadService.deleteFile).not.toHaveBeenCalled();
      expect(db.user.update).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        ADMIN_ID,
        "SHOP_DELETE",
        "SHOP",
        "shop-1",
        { shop_name: "Cafe", owner_id: undefined }
      );
    });

    it("rejects a blank id", async () => {
      await expect(deleteShopAction("")).rejects.toThrow(BadRequestError);
    });

    it("throws NotFoundError for an unknown shop", async () => {
      shops.findById.mockResolvedValue(null);

      await expect(deleteShopAction("shop-1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateShopVerificationAction", () => {
    itGuardsAdminAccess(
      () => updateShopVerificationAction("shop-1", "VERIFIED"),
      "Failed to update shop verification status."
    );

    it.each([
      ["VERIFIED", "SUCCESS", "SHOP_VERIFY", "has been verified"],
      ["REJECTED", "ERROR", "SHOP_REJECT", "verification has been rejected"],
      ["PENDING", "INFO", "SHOP_VERIFY", "is now pending verification"],
    ] as const)(
      "sets %s, notifies with %s and audits %s",
      async (status, type, auditAction, phrase) => {
        shops.findById.mockResolvedValue(shop());
        shops.update.mockResolvedValue(shop({ verification_status: status }));

        const res = await updateShopVerificationAction("shop-1", status);

        expect(shops.update).toHaveBeenCalledWith("shop-1", {
          verification_status: status,
        });
        expect(notify).toHaveBeenCalledWith(
          "owner-1",
          expect.objectContaining({
            type,
            message: `Your shop "Cafe" ${phrase}.`,
          })
        );
        expect(auditService.log).toHaveBeenCalledWith(
          ADMIN_ID,
          auditAction,
          "SHOP",
          "shop-1",
          { shop_name: "Cafe", new_status: status, old_status: "PENDING" }
        );
        expect(res.data?.verification_status).toBe(status);
      }
    );

    it.each([
      ["a blank id", " ", "VERIFIED"],
      ["a missing status", "shop-1", ""],
      ["a blank status", "shop-1", "  "],
      ["an unknown status", "shop-1", "BOGUS"],
    ])("rejects %s", async (_name, id, status) => {
      await expect(
        updateShopVerificationAction(id, status as never)
      ).rejects.toThrow(BadRequestError);
      expect(shops.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown shop", async () => {
      shops.findById.mockResolvedValue(null);

      await expect(
        updateShopVerificationAction("shop-1", "VERIFIED")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getShopStatsAction", () => {
    itGuardsAdminAccess(
      () => getShopStatsAction(),
      "Failed to retrieve shop statistics."
    );

    it("aggregates the shop counts", async () => {
      shops.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const res = await getShopStatsAction();

      expect(res.data).toEqual({
        totalShops: 10,
        activeShops: 7,
        inactiveShops: 3,
        verifiedShops: 5,
        pendingVerification: 2,
        recentShops: 1,
      });
    });
  });

  describe("ownerless shops", () => {
    // Regression: Shop.user is optional; these used `shop.user!.id` and failed
    // with a 500 after the update had already been written.
    it.each([
      ["activateShopAction", () => activateShopAction("shop-1"), false],
      ["deactivateShopAction", () => deactivateShopAction("shop-1"), true],
      [
        "updateShopVerificationAction",
        () => updateShopVerificationAction("shop-1", "VERIFIED"),
        true,
      ],
    ] as const)(
      "%s succeeds without notifying an owner",
      async (_name, run, isActive) => {
        shops.findById.mockResolvedValue(
          shop({ user: null, is_active: isActive })
        );
        carts.findMany.mockResolvedValue([] as never);
        shops.update.mockResolvedValue(shop({ user: null }));

        const res = await run();

        expect(res.success).toBe(true);
        expect(notify).not.toHaveBeenCalled();
        expect(auditService.log).toHaveBeenCalled();
      }
    );
  });

  it("does not wrap ForbiddenError raised inside an action", async () => {
    shops.findById.mockResolvedValue(shop());

    await expect(activateShopAction("shop-1")).rejects.toThrow(ForbiddenError);
  });
});
