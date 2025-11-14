"use server";

import { Prisma } from "@prisma/client";

import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/custom-error";
import productRepository from "@/repositories/product.repository";
import { fileUploadService } from "@/services/file-upload/file-upload.service";
import { notificationService } from "@/services/notification/notification.service";
import {
  ActionResponse,
  createSuccessResponse,
  CursorPaginatedResponse,
} from "@/types/response.types";

import { verifyAdmin } from "../authentication/admin";

export async function getAllProductsAction(options: {
  limit?: number;
  cursor?: string;
  search?: string;
  shop_id?: string;
}): Promise<
  ActionResponse<
    CursorPaginatedResponse<{
      id: string;
      name: string;
      price: number;
      stock_quantity: number;
      created_at: Date;
      shop: {
        id: string;
        name: string;
      };
    }>
  >
> {
  try {
    await verifyAdmin();

    const limit = options.limit || 20;
    const where: Prisma.ProductWhereInput = {};

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options.shop_id) {
      where.shop_id = options.shop_id;
    }

    const products = await productRepository.findMany({
      where,
      take: limit + 1,
      skip: options.cursor ? 1 : 0,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        stock_quantity: true,
        created_at: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const hasMore = products.length > limit;
    const data = hasMore ? products.slice(0, -1) : products;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return createSuccessResponse(
      {
        data: data.map((product) => ({
          ...product,
          price: Number(product.price),
        })),
        nextCursor,
        hasMore,
      },
      "Products retrieved successfully"
    );
  } catch (error) {
    console.error("GET ALL PRODUCTS ERROR:", error);
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError("Failed to retrieve products.");
  }
}

export async function deleteProductAction(
  productId: string
): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    await verifyAdmin();

    const product = await productRepository.findById(productId, {
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            user: {
              select: { id: true },
            },
          },
        },
        orderItems: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Check if product has been ordered - cannot delete products in order history
    if (product.orderItems && product.orderItems.length > 0) {
      throw new ForbiddenError(
        `Cannot delete product "${product.name}". This product has order history. Consider marking it as out of stock instead.`
      );
    }

    // Delete product image if exists
    if (product.image_key) {
      try {
        await fileUploadService.deleteFile(product.image_key);
      } catch (error) {
        console.error("Error deleting product image:", error);
      }
    }

    // Delete the product
    await productRepository.delete(productId);

    // Notify shop owner
    if (product.shop?.user?.id) {
      await notificationService.publishNotification(product.shop.user.id, {
        title: "Product Deleted",
        message: `Product "${product.name}" from your shop "${product.shop.name}" has been deleted by an admin.`,
        type: "WARNING",
        category: "SYSTEM",
        action_url: "/owner-shops",
      });
    }

    return createSuccessResponse(
      {
        id: product.id,
        name: product.name,
      },
      `Successfully deleted product "${product.name}"`
    );
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof ForbiddenError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to delete product.");
  }
}
