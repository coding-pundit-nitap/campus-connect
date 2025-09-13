import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { FullCart } from "@/types/cart.types";

export type CartFindOptions = Omit<Prisma.CartFindManyArgs, "where">;

class CartRepository {
  async findOrCreate(user_id: string, shop_id: string): Promise<FullCart> {
    const cart = await prisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
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
            product: { include: { category: true } },
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  async upsertItem(
    user_id: string,
    product_id: string,
    quantity: number
  ): Promise<FullCart> {
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
            cart_id: (await this.findOrCreate(user_id, shop_id)).id,
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
      const cart = await this.findOrCreate(user_id, shop_id);
      await prisma.cartItem.deleteMany({
        where: { cart_id: cart.id, product_id },
      });
    }
    return this.findOrCreate(user_id, shop_id);
  }

  async clear(cart_id: string, product_id: string) {
    return await prisma.cartItem.deleteMany({
      where: { cart_id, product_id },
    });
  }

  async getAllUserCartsWithItems(user_id: string): Promise<FullCart[]> {
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
                  select: { name: true, id: true },
                },
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async removeItem(cart_id: string, product_id: string) {
    return await prisma.cartItem.deleteMany({
      where: { cart_id, product_id },
    });
  }
}

export const cartRepository = new CartRepository();
export default cartRepository;
