"use server";

import { requireUserId, runAction } from "@/actions/_shared/action-helpers";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";
const log = createLogger("reorder-action");

export async function reorderAction(
  order_id: string
): Promise<ActionResponse<{ cartItemsAdded: number; shop_id: string }>> {
  return runAction(
    log,
    {
      label: "REORDER ERROR:",
      fallback: "Failed to reorder.",
      passthrough: [UnauthorizedError, NotFoundError, ValidationError],
    },
    async () => {
      const userId = await requireUserId();

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

      const inCart = new Map(
        (
          await prisma.cartItem.findMany({
            where: { cart_id: cart.id },
            select: { product_id: true, quantity: true },
          })
        ).map((line) => [line.product_id, line.quantity])
      );

      let itemsAdded = 0;
      for (const item of order.items) {
        if (item.product.deleted_at) continue;

        // A cart line never exceeds stock: reorder tops it up to at most
        // the available quantity and skips products already at that cap.
        const current = inCart.get(item.product_id) ?? 0;
        const quantity = Math.min(
          current + item.quantity,
          item.product.stock_quantity
        );
        if (quantity <= current) continue;

        await prisma.cartItem.upsert({
          where: {
            cart_id_product_id: {
              cart_id: cart.id,
              product_id: item.product_id,
            },
          },
          update: { quantity },
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
    }
  );
}
