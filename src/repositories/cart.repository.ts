import { Cart } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils";
import { FullCart } from "@/types/cart.type";

/**
 * Service class for cart-related database operations.
 *
 * Provides comprehensive cart management functionality including cart creation,
 * item management, and multi-shop cart operations. Implements proper database
 * transactions and error handling for all cart operations.
 *
 */
class CartRepository {
  /**
   * Retrieves or creates a cart for a specific user and shop combination.
   *
   * Fetches the existing cart for the user-shop pair, or creates a new one if none exists.
   * Returns the complete cart with all items and their associated product details.
   * This method ensures every user has a cart for each shop they interact with.
   *
   * @param shop_id - The unique identifier of the shop
   * @returns A promise that resolves to the complete cart with items and product details
   *
   */
  async getCartForShop(shop_id: string): Promise<FullCart> {
    const user_id = await authUtils.getUserId();
    const cart = await prisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (cart) {
      return cart;
    }

    return prisma.cart.create({
      data: { user_id, shop_id },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  /**
   * Adds, updates, or removes an item in the user's cart for the product's shop.
   *
   * Performs an upsert operation on cart items - creates new item if it doesn't exist,
   * updates quantity if it does exist, or removes the item if quantity is 0 or negative.
   * Automatically determines the correct shop based on the product and manages the
   * appropriate cart for that shop.
   *
   * @param product_id - The unique identifier of the product to add/update/remove
   * @param quantity - The desired quantity (0 or negative to remove item)
   * @returns A promise that resolves to the updated cart with all items
   *
   * @throws {Error} When product is not found or database operation fails
   *
   */
  async upsertCartItem(
    product_id: string,
    quantity: number
  ): Promise<FullCart> {
    const user_id = await authUtils.getUserId();
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      select: { shop_id: true },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    const { shop_id } = product;
    if (quantity > 0) {
      await prisma.cartItem.upsert({
        where: {
          cart_id_product_id: {
            cart_id: (await this.getCartForShop(shop_id)).id,
            product_id: product_id,
          },
        },
        update: { quantity },
        create: {
          quantity,
          cart: { connect: { user_id_shop_id: { user_id, shop_id } } },
          product: { connect: { id: product_id } },
        },
      });
    } else {
      const cart = await this.getCartForShop(shop_id);
      await prisma.cartItem.deleteMany({
        where: { cart_id: cart.id, product_id },
      });
    }
    return this.getCartForShop(shop_id);
  }

  /**
   * Clears all items from a user's cart for a specific shop.
   *
   * Removes all cart items associated with the specified user and shop combination,
   * effectively emptying the cart while preserving the cart entity itself.
   * Useful for post-checkout cleanup or when user wants to start fresh.
   *
   * @param shop_id - The unique identifier of the shop whose cart to clear
   * @returns A promise that resolves to the empty cart entity
   *
   */
  async clearShopCart(shop_id: string): Promise<Cart> {
    const cart = await this.getCartForShop(shop_id);
    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });
    return cart;
  }

  /**
   * Retrieves all carts associated with a specific user across all shops.
   *
   * Fetches a comprehensive list of all carts that belong to the specified user,
   * including carts from different shops with their complete item details and
   * product information. Useful for displaying user's complete shopping state
   * and cross-shop cart management.
   *
   * @param user_id - The unique identifier of the user whose carts to retrieve
   * @returns A promise that resolves to an array of complete carts with items and products
   *
   */
  async getAllUserCarts(): Promise<FullCart[]> {
    const user_id = await authUtils.getUserId();
    return prisma.cart.findMany({
      where: {
        user_id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

const cartRepository = new CartRepository();
export default cartRepository;
