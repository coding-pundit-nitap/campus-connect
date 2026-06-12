import { Cart, Prisma } from "@/generated/client";
import { prisma } from "@/lib/prisma";
import { FullCart } from "@/types/cart.types";

import { BaseRepository } from "./base.repository";

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

export class CartRepository extends BaseRepository<
  Cart,
  Prisma.CartFindUniqueArgs,
  Prisma.CartFindManyArgs,
  Prisma.CartCreateArgs,
  Prisma.CartUpdateArgs,
  Prisma.CartDeleteArgs
> {
  constructor(private readonly prismaClient: typeof prisma = prisma) {
    super(prismaClient.cart);
  }

  async findOrCreate(user_id: string, shop_id: string): Promise<FullCart> {
    const cart = await this.prismaClient.cart.findUnique({
      where: { user_id_shop_id: { user_id: user_id, shop_id: shop_id } },
      include: fullCartInclude,
    });

    if (cart) {
      return cart;
    }

    return this.prismaClient.cart.create({
      data: { user_id, shop_id },
      include: fullCartInclude,
    });
  }

  async upsertItem(
    user_id: string,
    product_id: string,
    quantity: number
  ): Promise<FullCart> {
    const product = await this.prismaClient.product.findUnique({
      where: { id: product_id },
      select: { shop_id: true },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    const { shop_id } = product;
    if (quantity > 0) {
      await this.prismaClient.cartItem.upsert({
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
      await this.prismaClient.cartItem.deleteMany({
        where: { cart_id: cart.id, product_id },
      });
    }
    return this.findOrCreate(user_id, shop_id);
  }

  async clear(cart_id: string, product_id: string) {
    return await this.prismaClient.cartItem.deleteMany({
      where: { cart_id, product_id },
    });
  }

  async clearAllItems(cart_id: string) {
    return await this.prismaClient.cartItem.deleteMany({
      where: { cart_id },
    });
  }

  async upsertCartItem(args: {
    cart_id: string;
    product_id: string;
    quantity: number;
  }) {
    return await this.prismaClient.cartItem.upsert({
      where: {
        cart_id_product_id: {
          cart_id: args.cart_id,
          product_id: args.product_id,
        },
      },
      update: { quantity: { increment: args.quantity } },
      create: {
        cart_id: args.cart_id,
        product_id: args.product_id,
        quantity: args.quantity,
      },
    });
  }

  async findOrCreateByUserAndShop(
    user_id: string,
    shop_id: string
  ): Promise<Cart> {
    const existing = await this.prismaClient.cart.findUnique({
      where: { user_id_shop_id: { user_id, shop_id } },
    });
    if (existing) return existing;
    return this.prismaClient.cart.create({
      data: { user_id, shop_id },
    });
  }

  async getAllUserCartsWithItems(user_id: string): Promise<FullCart[]> {
    return this.prismaClient.cart.findMany({
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
    return this.prismaClient.cart.findUnique({
      where: {
        id: cart_id,
        user_id,
      },
      include: fullCartInclude,
    });
  }

  async removeItem(cart_id: string, product_id: string) {
    return await this.prismaClient.cartItem.deleteMany({
      where: { cart_id, product_id },
    });
  }

  async getUserIdsByProductInCart(product_id: string): Promise<string[]> {
    const cartItems = await this.prismaClient.cartItem.findMany({
      where: { product_id },
      include: {
        cart: {
          select: { user_id: true },
        },
      },
    });

    return Array.from(new Set(cartItems.map((item) => item.cart.user_id)));
  }

  async findMany<T extends Prisma.CartFindManyArgs>(
    args?: T
  ): Promise<Prisma.Result<Prisma.CartDelegate, T, "findMany">>;
  override async findMany(args?: Prisma.CartFindManyArgs): Promise<Cart[]>;
  override async findMany(
    args?: Prisma.CartFindManyArgs
  ): Promise<
    | Cart[]
    | Prisma.Result<Prisma.CartDelegate, Prisma.CartFindManyArgs, "findMany">
  > {
    return this.prismaClient.cart.findMany(args);
  }

  async findUnique<T extends Prisma.CartFindUniqueArgs>(
    args: T
  ): Promise<Prisma.Result<Prisma.CartDelegate, T, "findUnique">>;
  override async findUnique(
    args: Prisma.CartFindUniqueArgs
  ): Promise<Cart | null>;
  override async findUnique(
    args: Prisma.CartFindUniqueArgs
  ): Promise<
    | Cart
    | null
    | Prisma.Result<
        Prisma.CartDelegate,
        Prisma.CartFindUniqueArgs,
        "findUnique"
      >
  > {
    return this.prismaClient.cart.findUnique(args);
  }

  async count(args?: Prisma.CartCountArgs): Promise<number> {
    return this.prismaClient.cart.count(args);
  }
}

export const cartRepository = new CartRepository();
export default cartRepository;
