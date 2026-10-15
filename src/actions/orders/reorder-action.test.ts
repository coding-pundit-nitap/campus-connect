import { type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";

import { reorderAction } from "./reorder-action";

vi.mock("@/lib/utils/auth.utils.server", async () =>
  (await import("@tests/helpers")).authUtilsModule()
);
vi.mock("@/lib/prisma", async () => ({
  prisma: (await import("@tests/helpers")).createPrismaMock(),
}));

const auth = vi.mocked(authUtils);
const db = prisma as unknown as PrismaMock;

const item = (
  product_id: string,
  quantity: number,
  product: Record<string, unknown> = {}
) => ({
  product_id,
  quantity,
  product: { id: product_id, stock_quantity: 10, deleted_at: null, ...product },
});

const pastOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "order-1",
  user_id: "user-1",
  shop_id: "shop-1",
  items: [item("p1", 2)],
  ...overrides,
});

describe("reorderAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.getUserId.mockResolvedValue("user-1");
    db.order.findUnique.mockResolvedValue(pastOrder());
    db.shop.findUnique.mockResolvedValue({ is_active: true, deleted_at: null });
    db.cart.findUnique.mockResolvedValue({ id: "cart-1" });
  });

  it("adds the available items to the existing cart, capped by stock", async () => {
    db.order.findUnique.mockResolvedValue(
      pastOrder({
        items: [
          item("p1", 2),
          item("p2", 8, { stock_quantity: 3 }),
          item("p3", 1, { deleted_at: new Date() }),
          item("p4", 1, { stock_quantity: 0 }),
        ],
      })
    );

    const res = await reorderAction("order-1");

    expect(db.cart.create).not.toHaveBeenCalled();
    expect(db.cartItem.upsert).toHaveBeenCalledTimes(2);
    expect(db.cartItem.upsert).toHaveBeenCalledWith({
      where: { cart_id_product_id: { cart_id: "cart-1", product_id: "p2" } },
      update: { quantity: { increment: 3 } },
      create: { cart_id: "cart-1", product_id: "p2", quantity: 3 },
    });
    expect(res).toMatchObject({
      success: true,
      data: { cartItemsAdded: 2, shop_id: "shop-1" },
      details: "Added 2 items to your cart",
    });
  });

  it("queries the order, shop and cart with exact args", async () => {
    await reorderAction("order-1");

    expect(db.order.findUnique).toHaveBeenCalledWith({
      where: { id: "order-1" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                stock_quantity: true,
                deleted_at: true,
                shop_id: true,
              },
            },
          },
        },
      },
    });
    expect(db.shop.findUnique).toHaveBeenCalledWith({
      where: { id: "shop-1" },
      select: { is_active: true, deleted_at: true },
    });
    expect(db.cart.findUnique).toHaveBeenCalledWith({
      where: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } },
    });
  });

  it.each([
    ["caps at stock when stock is lower", 5, 3, 3],
    ["keeps the quantity when stock is exactly equal", 4, 4, 4],
    ["keeps the quantity when stock is higher", 2, 9, 2],
  ])("%s", async (_n, wanted, stock, expected) => {
    db.order.findUnique.mockResolvedValue(
      pastOrder({ items: [item("p1", wanted, { stock_quantity: stock })] })
    );

    await reorderAction("order-1");

    expect(db.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: { increment: expected } },
        create: { cart_id: "cart-1", product_id: "p1", quantity: expected },
      })
    );
  });

  it("creates a cart when the user has none for the shop", async () => {
    db.cart.findUnique.mockResolvedValue(null);
    db.cart.create.mockResolvedValue({ id: "new-cart" });

    await reorderAction("order-1");

    expect(db.cart.create).toHaveBeenCalledWith({
      data: { user_id: "user-1", shop_id: "shop-1" },
    });
    expect(db.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { cart_id: "new-cart", product_id: "p1", quantity: 2 },
      })
    );
  });

  it.each([
    [
      "there is no user",
      () => auth.getUserId.mockResolvedValue(""),
      new UnauthorizedError("Unauthorized: Please log in."),
    ],
    [
      "the order does not exist",
      () => db.order.findUnique.mockResolvedValue(null),
      new NotFoundError("Order not found"),
    ],
    [
      "the order belongs to someone else",
      () => db.order.findUnique.mockResolvedValue(pastOrder({ user_id: "x" })),
      new UnauthorizedError("This order doesn't belong to you"),
    ],
    [
      "the order has no shop",
      () => db.order.findUnique.mockResolvedValue(pastOrder({ shop_id: null })),
      new ValidationError("Order has no associated shop"),
    ],
    [
      "the shop is gone",
      () => db.shop.findUnique.mockResolvedValue(null),
      new ValidationError("Shop is no longer available"),
    ],
    [
      "the shop is deleted",
      () =>
        db.shop.findUnique.mockResolvedValue({
          is_active: true,
          deleted_at: new Date(),
        }),
      new ValidationError("Shop is no longer available"),
    ],
    [
      "the shop is inactive",
      () =>
        db.shop.findUnique.mockResolvedValue({
          is_active: false,
          deleted_at: null,
        }),
      new ValidationError("Shop is no longer available"),
    ],
    [
      "no item is available",
      () =>
        db.order.findUnique.mockResolvedValue(
          pastOrder({ items: [item("p1", 1, { stock_quantity: 0 })] })
        ),
      new ValidationError(
        "No items could be added. Products may be out of stock or no longer available."
      ),
    ],
    [
      "the database fails",
      () => db.order.findUnique.mockRejectedValue(new Error("db")),
      new InternalServerError("Failed to reorder."),
    ],
  ])("throws when %s", async (_case, arrange, expected) => {
    arrange();

    const promise = reorderAction("order-1");

    await expect(promise).rejects.toBeInstanceOf(expected.constructor);
    await expect(promise).rejects.toThrow(expected.message);
  });
});
