import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import { toggleStockWatchAction } from "./stock-watch-actions";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;
const product = { id: "prod-1", name: "Product 1", stock_quantity: 0 };

describe("toggleStockWatchAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    db.product.findUnique.mockResolvedValue(product);
  });

  it("starts watching when the user is not watching yet", async () => {
    db.stockWatch.findUnique.mockResolvedValue(null);

    const response = await toggleStockWatchAction("prod-1");

    expect(db.stockWatch.create).toHaveBeenCalledWith({
      data: { user_id: "user-1", product_id: "prod-1" },
    });
    expect(response).toMatchObject({
      success: true,
      data: { isWatching: true },
      details: `You'll be notified when "Product 1" is back in stock`,
    });
  });

  it("stops watching when already watching", async () => {
    db.stockWatch.findUnique.mockResolvedValue({ id: "watch-1" });

    const response = await toggleStockWatchAction("prod-1");

    expect(db.stockWatch.delete).toHaveBeenCalledWith({
      where: { id: "watch-1" },
    });
    expect(response).toMatchObject({
      success: true,
      data: { isWatching: false },
      details: "Stock notification removed",
    });
  });

  it.each([
    [
      "not logged in",
      () => auth.getUserId.mockResolvedValue(""),
      "prod-1",
      UnauthorizedError,
    ],
    ["the product id is missing", () => undefined, undefined, BadRequestError],
    [
      "the product does not exist",
      () => db.product.findUnique.mockResolvedValue(null),
      "prod-1",
      NotFoundError,
    ],
    [
      "the database fails",
      () => db.stockWatch.findUnique.mockRejectedValue(new Error("db")),
      "prod-1",
      InternalServerError,
    ],
  ])("throws when %s", async (_case, arrange, productId, ErrorType) => {
    arrange();

    await expect(
      toggleStockWatchAction(productId as string)
    ).rejects.toBeInstanceOf(ErrorType);
  });
});
