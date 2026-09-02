import { beforeEach,describe, expect, it, vi } from "vitest";

import { CartRepository } from "./cart.repository";

// Mock Prisma Client
const buildFakePrismaClient = () => {
  return {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    cartItem: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  } as any;
};

describe("CartRepository", () => {
  let prisma: ReturnType<typeof buildFakePrismaClient>;
  let repository: CartRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = buildFakePrismaClient();
    repository = new CartRepository(prisma);
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
      prisma.product.findUnique.mockResolvedValueOnce({ shop_id: "shop-1" });
      
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
          cart: { connect: { user_id_shop_id: { user_id: "user-1", shop_id: "shop-1" } } },
          product: { connect: { id: "prod-1" } },
        },
      });
    });

    it("deletes item if quantity is 0", async () => {
      prisma.product.findUnique.mockResolvedValueOnce({ shop_id: "shop-1" });
      prisma.cart.findUnique.mockResolvedValue({ id: "cart-1" });
      
      await repository.upsertItemForUser("user-1", "prod-1", 0);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: "cart-1", product_id: "prod-1" },
      });
      expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
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
      await repository.upsertCartItem({ cart_id: "cart-1", product_id: "prod-1", quantity: 3 });

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
          include: expect.any(Object),
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
          include: expect.any(Object),
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
});
