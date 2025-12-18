"use server";

import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

export async function reorderAction(
  order_id: string
): Promise<ActionResponse<{ cartItemsAdded: number; shop_id: string }>> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const order = await prisma.order.findUnique({
      where: { id: order_id },
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

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.user_id !== userId) {
      throw new UnauthorizedError("This order doesn't belong to you");
    }

    if (!order.shop_id) {
      throw new ValidationError("Order has no associated shop");
    }

    const shop = await prisma.shop.findUnique({
      where: { id: order.shop_id },
      select: { is_active: true, deleted_at: true },
    });

    if (!shop || shop.deleted_at || !shop.is_active) {
      throw new ValidationError("Shop is no longer available");
    }

    let cart = await prisma.cart.findUnique({
      where: { user_id_shop_id: { user_id: userId, shop_id: order.shop_id } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId, shop_id: order.shop_id },
      });
    }

    let itemsAdded = 0;
    for (const item of order.items) {
      if (item.product.deleted_at) continue;

      if (item.product.stock_quantity <= 0) continue;

      const quantity = Math.min(item.quantity, item.product.stock_quantity);

      await prisma.cartItem.upsert({
        where: {
          cart_id_product_id: { cart_id: cart.id, product_id: item.product_id },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          cart_id: cart.id,
          product_id: item.product_id,
          quantity,
        },
      });

      itemsAdded++;
    }

    if (itemsAdded === 0) {
      throw new ValidationError(
        "No items could be added. Products may be out of stock or no longer available."
      );
    }

    return createSuccessResponse(
      { cartItemsAdded: itemsAdded, shop_id: order.shop_id },
      `Added ${itemsAdded} items to your cart`
    );
  } catch (error) {
    console.error("REORDER ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof ValidationError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to reorder.");
  }
}
