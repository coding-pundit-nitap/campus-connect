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

import { toggleFavoriteShopAction } from "./favorite-shops-actions";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;

describe("toggleFavoriteShopAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    db.shop.findUnique.mockResolvedValue({ id: "shop-1" });
  });

  it("adds the shop to favorites when it is not one yet", async () => {
    db.favoriteShop.findUnique.mockResolvedValue(null);

    const res = await toggleFavoriteShopAction("shop-1");

    expect(db.favoriteShop.create).toHaveBeenCalledWith({
      data: { user_id: "user-1", shop_id: "shop-1" },
    });
    expect(res).toMatchObject({
      data: { isFavorite: true },
      details: "Shop added to favorites",
    });
  });

  it("removes an existing favorite", async () => {
    db.favoriteShop.findUnique.mockResolvedValue({ id: "fav-1" });

    const res = await toggleFavoriteShopAction("shop-1");

    expect(db.favoriteShop.delete).toHaveBeenCalledWith({
      where: { id: "fav-1" },
    });
    expect(res).toMatchObject({
      data: { isFavorite: false },
      details: "Shop removed from favorites",
    });
  });

  it.each([
    [
      "no user",
      () => auth.getUserId.mockResolvedValue(""),
      "shop-1",
      UnauthorizedError,
    ],
    ["an empty id", () => undefined, "", BadRequestError],
    ["a non-string id", () => undefined, 42, BadRequestError],
    [
      "an unknown shop",
      () => db.shop.findUnique.mockResolvedValue(null),
      "shop-1",
      NotFoundError,
    ],
    [
      "a database failure",
      () => db.shop.findUnique.mockRejectedValue(new Error("db")),
      "shop-1",
      InternalServerError,
    ],
  ])("throws on %s", async (_case, arrange, shopId, ErrorType) => {
    arrange();

    await expect(
      toggleFavoriteShopAction(shopId as string)
    ).rejects.toBeInstanceOf(ErrorType);
  });
});
