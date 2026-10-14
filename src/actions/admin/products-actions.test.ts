import {
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
  rows,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fileUploadService,
  notificationService,
  productRepository,
} from "@/di/container";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/custom-error";

import {
  deleteProductAction,
  getAllProductsAction,
  getProductStatsAction,
} from "./products-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const products = vi.mocked(productRepository);
const notify = vi.mocked(notificationService.publishNotification);
const deleteFile = vi.mocked(fileUploadService.deleteFile);

const product = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "prod-1",
    name: "Tea",
    image_key: null,
    orderItems: [],
    shop: { id: "shop-1", name: "Cafe", user: { id: "owner-1" } },
    ...overrides,
  }) as never;

describe("admin product actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllProductsAction", () => {
    itGuardsAdminAccess(
      () => getAllProductsAction({ limit: 10 }),
      "Failed to retrieve products."
    );

    it("returns products with numeric prices and no filters", async () => {
      products.findMany.mockResolvedValue(
        rows(1, "p", () => ({ price: "9.99" })) as never
      );

      const res = await getAllProductsAction({ limit: 10 });

      expect(products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 11, skip: 0 })
      );
      expect(res.data).toEqual({
        data: [{ id: "p-1", price: 9.99 }],
        nextCursor: null,
        hasMore: false,
      });
    });

    it("applies search, shop filter and cursor", async () => {
      products.findMany.mockResolvedValue(
        rows(2, "p", () => ({ price: 1 })) as never
      );

      const res = await getAllProductsAction({
        limit: 1,
        cursor: CURSOR,
        search: "tea",
        shop_id: "shop-1",
      });

      expect(products.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "tea", mode: "insensitive" } },
              { description: { contains: "tea", mode: "insensitive" } },
            ],
            shop_id: "shop-1",
          },
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.hasMore).toBe(true);
    });

    it("rejects invalid options with BadRequestError", async () => {
      await expect(getAllProductsAction({ limit: -5 })).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("deleteProductAction", () => {
    itGuardsAdminAccess(
      () => deleteProductAction("prod-1"),
      "Failed to delete product."
    );

    it("deletes the image and product and notifies the owner", async () => {
      products.findById.mockResolvedValue(product({ image_key: "img" }));

      const res = await deleteProductAction("prod-1");

      expect(deleteFile).toHaveBeenCalledWith("img");
      expect(products.delete).toHaveBeenCalledWith("prod-1");
      expect(notify).toHaveBeenCalledWith(
        "owner-1",
        expect.objectContaining({
          title: "Product Deleted",
          message:
            'Product "Tea" from your shop "Cafe" has been deleted by an admin.',
        })
      );
      expect(res.data).toEqual({ id: "prod-1", name: "Tea" });
    });

    it("still deletes the product when image deletion fails", async () => {
      products.findById.mockResolvedValue(product({ image_key: "img" }));
      deleteFile.mockRejectedValueOnce(new Error("s3 down"));

      const res = await deleteProductAction("prod-1");

      expect(products.delete).toHaveBeenCalledWith("prod-1");
      expect(res.success).toBe(true);
    });

    it("skips image deletion and notification when there is none to do", async () => {
      products.findById.mockResolvedValue(
        product({ shop: null, orderItems: undefined })
      );

      await deleteProductAction("prod-1");

      expect(deleteFile).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
      expect(products.delete).toHaveBeenCalled();
    });

    it("rejects a blank id with BadRequestError", async () => {
      await expect(deleteProductAction(" ")).rejects.toThrow(BadRequestError);
      expect(products.findById).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown product", async () => {
      products.findById.mockResolvedValue(null);

      await expect(deleteProductAction("prod-1")).rejects.toThrow(
        NotFoundError
      );
    });

    it("forbids deleting a product with order history", async () => {
      products.findById.mockResolvedValue(
        product({ orderItems: [{ id: "oi-1" }] })
      );

      await expect(deleteProductAction("prod-1")).rejects.toThrow(
        ForbiddenError
      );
      expect(products.delete).not.toHaveBeenCalled();
    });
  });

  describe("getProductStatsAction", () => {
    itGuardsAdminAccess(
      () => getProductStatsAction(),
      "Failed to retrieve product statistics."
    );

    it("aggregates product counts", async () => {
      products.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(2);

      const res = await getProductStatsAction();

      expect(res.data).toEqual({
        totalProducts: 10,
        inStockProducts: 7,
        outOfStockProducts: 3,
        recentProducts: 2,
      });
    });
  });
});
