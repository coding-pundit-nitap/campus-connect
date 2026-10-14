import {
  asAdmin,
  CURSOR,
  itGuardsAdminAccess,
} from "@tests/helpers/actions-admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { container } from "@/di/container";
import { BadRequestError } from "@/lib/custom-error";

import {
  getAllCategoriesAction,
  getCategoryStatsAction,
} from "./category-actions";

vi.mock("@/di/container", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).adminContainerModule()
);
vi.mock("@/lib/verify-admin", async () =>
  (await import("@tests/helpers/actions-admin/mocks")).verifyAdminModule()
);

const categories = vi.mocked(container.categoryRepository);

const category = (id: string, name: string, products: number, shops = 0) => ({
  id,
  name,
  _count: { products },
  products: Array.from({ length: shops }, (_, i) => ({ shop_id: `s${i}` })),
});

describe("admin category actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asAdmin();
  });

  describe("getAllCategoriesAction", () => {
    itGuardsAdminAccess(
      () => getAllCategoriesAction({ limit: 10 }),
      "Failed to retrieve categories."
    );

    it("maps product and distinct shop counts", async () => {
      categories.findMany.mockResolvedValue([
        category("c1", "Drinks", 5, 2),
      ] as never);

      const res = await getAllCategoriesAction({ limit: 10 });

      expect(categories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, take: 11, skip: 0 })
      );
      expect(res.data).toEqual({
        data: [{ id: "c1", name: "Drinks", productCount: 5, shopCount: 2 }],
        nextCursor: null,
        hasMore: false,
      });
    });

    it("applies search and cursor and paginates", async () => {
      categories.findMany.mockResolvedValue([
        category("c1", "A", 1),
        category("c2", "B", 1),
      ] as never);

      const res = await getAllCategoriesAction({
        limit: 1,
        cursor: CURSOR,
        search: "dri",
      });

      expect(categories.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: "dri", mode: "insensitive" } },
          cursor: { id: CURSOR },
        })
      );
      expect(res.data?.nextCursor).toBe("c1");
    });

    it("rejects invalid options with BadRequestError", async () => {
      await expect(getAllCategoriesAction({ limit: 0 })).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("getCategoryStatsAction", () => {
    itGuardsAdminAccess(
      () => getCategoryStatsAction(),
      "Failed to retrieve category statistics."
    );

    it("counts empty categories and returns the top five", async () => {
      categories.findMany.mockResolvedValue([
        category("1", "a", 1),
        category("2", "b", 0),
        category("3", "c", 9),
        category("4", "d", 3),
        category("5", "e", 4),
        category("6", "f", 2),
        category("7", "g", 0),
      ] as never);

      const res = await getCategoryStatsAction();

      expect(res.data).toEqual({
        totalCategories: 7,
        categoriesWithProducts: 5,
        emptyCategories: 2,
        topCategories: [
          { name: "c", count: 9 },
          { name: "e", count: 4 },
          { name: "d", count: 3 },
          { name: "f", count: 2 },
          { name: "a", count: 1 },
        ],
      });
    });
  });
});
