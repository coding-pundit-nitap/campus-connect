import { Prisma } from "@/../prisma/generated/client";
import { prisma } from "@/lib/prisma";
import { FullCart } from "@/types/cart.types";

export type CartFindOptions = Omit<Prisma.CartFindManyArgs, "where">;
export const fullCartInclude = Prisma.validator<Prisma.CartInclude>()({
  items: {
    include: {
      product: {
        include: {
          category: true,
          shop: {
            select: {
              id: true,
              name: true,
              qr_image_key: true,
              upi_id: true,
              opening: true,
              closing: true,
              default_delivery_fee: true,
              default_platform_fee: true,
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
                  { sort_order: Prisma.SortOrder.asc },
                  { cutoff_time_minutes: Prisma.SortOrder.asc },
                ],
              },
            },
          },
        },
      },
    },
    orderBy: { id: Prisma.SortOrder.asc },
  },
});
class CartRepository {
  async findOrCreate(user_id: string, shop_id: string): Promise<FullCart> {
    const cart = await prisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      include: fullCartInclude,
    });

    if (cart) {
      return cart;
    }

    return prisma.cart.create({
      data: { user_id, shop_id },
      include: fullCartInclude,
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
      include: fullCartInclude,
    });
  }
  async getUserCartWithItemsByCartId(
    user_id: string,
    cart_id: string
  ): Promise<FullCart | null> {
    return prisma.cart.findUnique({
      where: {
        id: cart_id,
        user_id,
      },
      include: fullCartInclude,
    });
  }

  async removeItem(cart_id: string, product_id: string) {
    return await prisma.cartItem.deleteMany({
      where: { cart_id, product_id },
    });
  }
  async getUserIdsByProductInCart(product_id: string): Promise<string[]> {
    const cartItems = await prisma.cartItem.findMany({
      where: { product_id },
      include: {
        cart: {
          select: { user_id: true },
        },
      },
    });

    return Array.from(new Set(cartItems.map((item) => item.cart.user_id)));
  }
}

export const cartRepository = new CartRepository();
export default cartRepository;
