import { beforeEach, describe, expect, it, vi } from "vitest";

import { BadRequestError, NotFoundError, UnauthorizedError } from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";

import { toggleStockWatchAction } from "./stock-watch-actions";

vi.mock("@/lib/logger", () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("@/lib/utils/auth.utils.server", () => ({
  authUtils: {
    getUserId: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
    stockWatch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("stock-watch-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleStockWatchAction", () => {
    it("should toggle on when not watching", async () => {
      vi.mocked(authUtils.getUserId).mockResolvedValue("user-1");
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-1", name: "Product 1", stock_quantity: 0 } as any);
      vi.mocked(prisma.stockWatch.findUnique).mockResolvedValue(null);

      const response = await toggleStockWatchAction("prod-1");

      expect(prisma.stockWatch.create).toHaveBeenCalledWith({
        data: { user_id: "user-1", product_id: "prod-1" },
      });
      expect(response.success).toBe(true);
      expect(response.data?.isWatching).toBe(true);
    });

    it("should toggle off when already watching", async () => {
      vi.mocked(authUtils.getUserId).mockResolvedValue("user-1");
      vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: "prod-1", name: "Product 1", stock_quantity: 0 } as any);
      vi.mocked(prisma.stockWatch.findUnique).mockResolvedValue({ id: "watch-1", user_id: "user-1", product_id: "prod-1" } as any);

      const response = await toggleStockWatchAction("prod-1");

      expect(prisma.stockWatch.delete).toHaveBeenCalledWith({
        where: { id: "watch-1" },
      });
      expect(response.success).toBe(true);
      expect(response.data?.isWatching).toBe(false);
    });

    it("should throw UnauthorizedError if not logged in", async () => {
      // @ts-expect-error Mocking unauthenticated state
      vi.mocked(authUtils.getUserId).mockResolvedValue(null);

      await expect(toggleStockWatchAction("prod-1")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw BadRequestError if product_id is invalid", async () => {
      vi.mocked(authUtils.getUserId).mockResolvedValue("user-1");

      // @ts-expect-error Intentionally invalid input
      await expect(toggleStockWatchAction(undefined)).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError if product not found", async () => {
      vi.mocked(authUtils.getUserId).mockResolvedValue("user-1");
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(toggleStockWatchAction("prod-1")).rejects.toThrow(NotFoundError);
    });
  });
});
