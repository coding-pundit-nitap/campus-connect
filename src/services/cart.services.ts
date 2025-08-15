import { Cart, CartItem, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FullCart = Cart & {
  items: (CartItem & { product: Product })[];
};

class CartServices {
  async getCartForShop(user_id: string, shop_id: string): Promise<FullCart> {
    const cart = await prisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      include: {
        items: {
          include: {
            product: true,
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
            product: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });
  }

  async upsertCartItem(
    user_id: string,
    product_id: string,
    quantity: number,
  ): Promise<FullCart> {
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      select: { shop_id: true },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    const shop_id = product.shop_id;

    const cart = await this.getCartForShop(user_id, shop_id);

    const existingItem = cart.items.find(
      (item) => item.product_id === product_id,
    );

    if (existingItem) {
      if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id: existingItem.id } });
      } else {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity },
        });
      }
    } else if (quantity > 0) {
      await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id,
          quantity,
        },
      });
    }

    return this.getCartForShop(user_id, shop_id);
  }

  async clearShopCart(user_id: string, shop_id: string): Promise<Cart> {
    const cart = await this.getCartForShop(user_id, shop_id);
    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });
    return cart;
  }

  async getAllUserCarts(user_id: string): Promise<FullCart[]> {
    return prisma.cart.findMany({
      where: {
        user_id: user_id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}

const cartServices = new CartServices();
export default cartServices;
