import { asPrisma, createPrismaMock, type PrismaMock } from "@tests/helpers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError, ValidationError } from "@/lib/custom-error";

import { CartRepository, fullCartInclude } from "./cart.repository";

const product = (overrides: Record<string, unknown> = {}) => ({
  shop_id: "shop-1",
  stock_quantity: 10,
  deleted_at: null,
  ...overrides,
});

describe("fullCartInclude", () => {
  it("has the exact shape needed by cart consumers", () => {
    expect(fullCartInclude).toStrictEqual({
      items: {
        include: {
          product: {
            include: {
              category: true,
              brand: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                  qr_image_key: true,
                  upi_id: true,
                  opening: true,
                  closing: true,
                  accepting_orders: true,
                  default_delivery_fee: true,
                  direct_delivery_fee: true,
                  min_order_value: true,
                  batch_slots: {
                    where: { is_active: true },
                    select: {
                      id: true,
                      cutoff_time_minutes: true,
                      label: true,
                      sort_order: true,
                      is_active: true,
                    },
                    orderBy: [
                      { sort_order: "asc" },
                      { cutoff_time_minutes: "asc" },
                    ],
                  },
                },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      },
    });
  });
});

describe("CartRepository", () => {
  let prisma: PrismaMock;
  let repository: CartRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createPrismaMock();
    repository = new CartRepository(asPrisma(prisma));
  });

  describe("findOrCreate", () => {
    it("returns existing cart if found", async () => {
      const mockCart = { id: "cart-1", user_id: "user-1", shop_id: "shop-1" };
      prisma.cart.findUnique.mockResolvedValueOnce(mockCart);

      const result = await repository.findOrCreate("user-1", "shop-1");

      expect(prisma.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } },
        })
      );
      expect(prisma.cart.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockCart);
    });

    it("creates new cart if not found", async () => {
      const mockCart = { id: "cart-1", user_id: "user-1", shop_id: "shop-1" };
      prisma.cart.findUnique.mockResolvedValueOnce(null);
      prisma.cart.create.mockResolvedValueOnce(mockCart);

      const result = await repository.findOrCreate("user-1", "shop-1");

      expect(prisma.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } },
        })
      );
      expect(prisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { user_id: "user-1", shop_id: "shop-1" },
        })
      );
      expect(result).toEqual(mockCart);
    });
  });

  describe("upsertItemForUser", () => {
    it("throws if product is not found", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(
        repository.upsertItemForUser("user-1", "prod-1", 2)
      ).rejects.toThrow("Product not found.");
    });

    it("upserts item if quantity > 0", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(product());

      prisma.cart.findUnique.mockResolvedValue({ id: "cart-1" });

      prisma.cartItem.upsert.mockResolvedValueOnce({});

      await repository.upsertItemForUser("user-1", "prod-1", 2);

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: {
            cart_id: "cart-1",
            product_id: "prod-1",
          },
        },
        update: { quantity: 2 },
        create: {
          quantity: 2,
          cart: {
            connect: {
              user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" },
            },
          },
          product: { connect: { id: "prod-1" } },
        },
      });
    });

    it("deletes item if quantity is 0, even for a deleted or sold-out product", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(
        product({ stock_quantity: 0, deleted_at: new Date() })
      );
      prisma.cart.findUnique.mockResolvedValue({ id: "cart-1" });

      await repository.upsertItemForUser("user-1", "prod-1", 0);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "cart-1", product_id: "prod-1" },
      });
      expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
    });

    it("throws NotFoundError for an unknown product", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(
        repository.upsertItemForUser("user-1", "prod-1", 1)
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it.each([
      [
        "a deleted product",
        { deleted_at: new Date() },
        1,
        "This product is no longer available.",
      ],
      [
        "more than the stock",
        { stock_quantity: 3 },
        4,
        "Only 3 left in stock.",
      ],
      [
        "a sold-out product",
        { stock_quantity: 0 },
        1,
        "This product is out of stock.",
      ],
    ])("rejects adding %s", async (_n, overrides, quantity, message) => {
      prisma.product.findUnique.mockResolvedValueOnce(product(overrides));

      await expect(
        repository.upsertItemForUser("user-1", "prod-1", quantity)
      ).rejects.toThrow(new ValidationError(message));
      expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
    });

    it("accepts exactly the stock", async () => {
      prisma.product.findUnique.mockResolvedValueOnce(
        product({ stock_quantity: 3 })
      );
      prisma.cart.findUnique.mockResolvedValue({ id: "cart-1" });

      await repository.upsertItemForUser("user-1", "prod-1", 3);

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { quantity: 3 } })
      );
    });
  });

  describe("clear", () => {
    it("deletes specific product from cart", async () => {
      await repository.clear("cart-1", "prod-1");

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "cart-1", product_id: "prod-1" },
      });
    });
  });

  describe("clearAllItems", () => {
    it("deletes all items from cart", async () => {
      await repository.clearAllItems("cart-1");

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "cart-1" },
      });
    });
  });

  describe("upsertCartItem", () => {
    it("upserts with incrementing quantity", async () => {
      await repository.upsertCartItem({
        cart_id: "cart-1",
        product_id: "prod-1",
        quantity: 3,
      });

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          cart_id_product_id: {
            cart_id: "cart-1",
            product_id: "prod-1",
          },
        },
        update: { quantity: { increment: 3 } },
        create: {
          cart_id: "cart-1",
          product_id: "prod-1",
          quantity: 3,
        },
      });
    });
  });

  describe("getAllUserCartsWithItems", () => {
    it("fetches carts for user with include", async () => {
      await repository.getAllUserCartsWithItems("user-1");

      expect(prisma.cart.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: "user-1" },
          include: fullCartInclude,
        })
      );
    });
  });

  describe("getUserCartWithItemsByCartId", () => {
    it("fetches specific cart with user scope hardening", async () => {
      await repository.getUserCartWithItemsByCartId("user-1", "cart-1");

      expect(prisma.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "cart-1",
            user_id: "user-1", // Scope hardening check
          },
          include: fullCartInclude,
        })
      );
    });
  });

  describe("removeItemFromCart", () => {
    it("deletes cart item", async () => {
      await repository.removeItemFromCart("cart-1", "prod-1");

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "cart-1", product_id: "prod-1" },
      });
    });
  });

  describe("getUserIdsByProductInCart", () => {
    it("returns unique user IDs for a product", async () => {
      prisma.cartItem.findMany.mockResolvedValueOnce([
        { cart: { user_id: "user-1" } },
        { cart: { user_id: "user-2" } },
        { cart: { user_id: "user-1" } },
      ]);

      const result = await repository.getUserIdsByProductInCart("prod-1");

      expect(prisma.cartItem.findMany).toHaveBeenCalledWith({
        where: { product_id: "prod-1" },
        include: { cart: { select: { user_id: true } } },
      });
      expect(result).toEqual(["user-1", "user-2"]);
    });
  });

  describe("findOrCreate include shape", () => {
    it("loads items with product, category, brand and the active shop batch slots", async () => {
      prisma.cart.findUnique.mockResolvedValueOnce({ id: "cart-1" });

      await repository.findOrCreate("user-1", "shop-1");

      const { include } = prisma.cart.findUnique.mock.calls[0][0];
      expect(include).toBe(fullCartInclude);
      expect(include.items.orderBy).toEqual({ id: "asc" });
      const shop = include.items.include.product.include.shop;
      expect(shop.select.batch_slots.where).toEqual({ is_active: true });
      expect(shop.select.batch_slots.orderBy).toEqual([
        { sort_order: "asc" },
        { cutoff_time_minutes: "asc" },
      ]);
    });
  });

  describe("upsertItemForUser result", () => {
    it("returns the refreshed full cart after the write", async () => {
      const fresh = { id: "cart-1", items: [{ id: "item-1" }] };
      prisma.product.findUnique.mockResolvedValueOnce(product());
      prisma.cart.findUnique.mockResolvedValue(fresh);

      const result = await repository.upsertItemForUser("user-1", "prod-1", 1);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        select: { shop_id: true, stock_quantity: true, deleted_at: true },
      });
      expect(result).toBe(fresh);
    });
  });

  describe("findOrCreateByUserAndShop", () => {
    it("returns the existing cart without creating one", async () => {
      const existing = { id: "cart-1" };
      prisma.cart.findUnique.mockResolvedValueOnce(existing);

      const result = await repository.findOrCreateByUserAndShop(
        "user-1",
        "shop-1"
      );

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } },
      });
      expect(prisma.cart.create).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it("creates a bare cart when none exists", async () => {
      const created = { id: "cart-2" };
      prisma.cart.findUnique.mockResolvedValueOnce(null);
      prisma.cart.create.mockResolvedValueOnce(created);

      const result = await repository.findOrCreateByUserAndShop(
        "user-1",
        "shop-1"
      );

      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { user_id: "user-1", shop_id: "shop-1" },
      });
      expect(result).toBe(created);
    });
  });

  describe("delegating finders", () => {
    it("findMany passes args through", async () => {
      prisma.cart.findMany.mockResolvedValueOnce([{ id: "cart-1" }]);

      const result = await repository.findMany({ take: 2 });

      expect(prisma.cart.findMany).toHaveBeenCalledWith({ take: 2 });
      expect(result).toEqual([{ id: "cart-1" }]);
    });

    it("findUnique passes args through", async () => {
      prisma.cart.findUnique.mockResolvedValueOnce({ id: "cart-1" });

      const result = await repository.findUnique({ where: { id: "cart-1" } });

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { id: "cart-1" },
      });
      expect(result).toEqual({ id: "cart-1" });
    });

    it("count passes args through", async () => {
      prisma.cart.count.mockResolvedValueOnce(4);

      const result = await repository.count({ where: { user_id: "user-1" } });

      expect(prisma.cart.count).toHaveBeenCalledWith({
        where: { user_id: "user-1" },
      });
      expect(result).toBe(4);
    });
  });
});
