"use server";

import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { notificationService } from "@/services/notification/notification.service";
import { ActionResponse, createSuccessResponse } from "@/types/response.types";

export async function toggleStockWatchAction(
  product_id: string
): Promise<ActionResponse<{ isWatching: boolean }>> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    if (!product_id || typeof product_id !== "string") {
      throw new BadRequestError("Invalid product ID");
    }

    const product = await prisma.product.findUnique({
      where: { id: product_id, deleted_at: null },
      select: { id: true, name: true, stock_quantity: true },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const existing = await prisma.stockWatch.findUnique({
      where: {
        user_id_product_id: { user_id: userId, product_id: product_id },
      },
    });

    if (existing) {
      await prisma.stockWatch.delete({
        where: { id: existing.id },
      });
      return createSuccessResponse(
        { isWatching: false },
        "Stock notification removed"
      );
    } else {
      await prisma.stockWatch.create({
        data: { user_id: userId, product_id: product_id },
      });
      return createSuccessResponse(
        { isWatching: true },
        `You'll be notified when "${product.name}" is back in stock`
      );
    }
  } catch (error) {
    console.error("TOGGLE STOCK WATCH ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to update stock watch.");
  }
}

export async function isWatchingStockAction(
  product_id: string
): Promise<ActionResponse<boolean>> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      return createSuccessResponse(false, "Not logged in");
    }

    const watch = await prisma.stockWatch.findUnique({
      where: {
        user_id_product_id: { user_id: userId, product_id: product_id },
      },
    });

    return createSuccessResponse(!!watch, "Stock watch status retrieved");
  } catch (error) {
    console.error("IS WATCHING STOCK ERROR:", error);
    return createSuccessResponse(false, "Error checking stock watch status");
  }
}

export async function getStockWatchesAction(): Promise<
  ActionResponse<
    Array<{
      id: string;
      product: {
        id: string;
        name: string;
        price: string;
        image_key: string;
        stock_quantity: number;
        shop: { name: string };
      };
    }>
  >
> {
  try {
    const userId = await authUtils.getUserId();
    if (!userId) {
      throw new UnauthorizedError("Unauthorized: Please log in.");
    }

    const watches = await prisma.stockWatch.findMany({
      where: { user_id: userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image_key: true,
            stock_quantity: true,
            deleted_at: true,
            shop: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const validWatches = watches
      .filter((watch) => watch.product.deleted_at === null)
      .map((watch) => ({
        id: watch.id,
        product: {
          id: watch.product.id,
          name: watch.product.name,
          price: watch.product.price.toString(),
          image_key: watch.product.image_key,
          stock_quantity: watch.product.stock_quantity,
          shop: { name: watch.product.shop.name },
        },
      }));

    return createSuccessResponse(validWatches, "Stock watches retrieved");
  } catch (error) {
    console.error("GET STOCK WATCHES ERROR:", error);
    throw new InternalServerError("Failed to retrieve stock watches.");
  }
}

export async function notifyStockWatchers(
  product_id: string,
  product_name: string,
  shop_name: string
): Promise<number> {
  try {
    const watchers = await prisma.stockWatch.findMany({
      where: { product_id: product_id },
      select: { user_id: true, id: true },
    });

    if (watchers.length === 0) return 0;

    await Promise.allSettled(
      watchers.map((w) =>
        notificationService.publishNotification(w.user_id, {
          title: "Back in Stock!",
          message: `"${product_name}" at ${shop_name} is now back in stock.`,
          type: "SUCCESS",
          category: "ORDER",
          action_url: `/product/${product_id}`,
        })
      )
    );

    await prisma.stockWatch.deleteMany({
      where: { product_id: product_id },
    });

    return watchers.length;
  } catch (error) {
    console.error("NOTIFY STOCK WATCHERS ERROR:", error);
    return 0;
  }
}
