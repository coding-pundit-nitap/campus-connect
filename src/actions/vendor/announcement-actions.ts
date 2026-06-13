"use server";

import { UnauthorizedError, ValidationError } from "@/lib/custom-error";
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { authUtils } from "@/lib/utils/auth.utils.server";
import { createSuccessResponse } from "@/types";
const log = createLogger("announcement-actions");

export type SerializedAnnouncement = {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_type: string;
  title: string;
  message: string;
  image_key: string | null;
  expires_at: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    discount: number | null;
    stock_quantity: number;
    image_key: string;
    brand: string | null;
    is_veg: boolean | null;
  } | null;
};

export async function getAnnouncementsAction() {
  try {
    const announcements = await prisma.shopAnnouncement.findMany({
      where: {
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        shop: {
          select: {
            name: true,
            shop_type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discount: true,
            stock_quantity: true,
            image_key: true,
            brand: true,
            is_veg: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const serialized: SerializedAnnouncement[] = announcements.map((ann) => ({
      id: ann.id,
      shop_id: ann.shop_id,
      shop_name: ann.shop.name,
      shop_type: ann.shop.shop_type,
      title: ann.title,
      message: ann.message,
      image_key: ann.image_key,
      expires_at: ann.expires_at.toISOString(),
      created_at: ann.created_at.toISOString(),
      product: ann.product
        ? {
            id: ann.product.id,
            name: ann.product.name,
            price: Number(ann.product.price),
            discount: ann.product.discount
              ? Number(ann.product.discount)
              : null,
            stock_quantity: ann.product.stock_quantity,
            image_key: ann.product.image_key,
            brand: ann.product.brand?.name || null,
            is_veg: ann.product.is_veg,
          }
        : null,
    }));

    return createSuccessResponse(
      serialized,
      "Announcements retrieved successfully"
    );
  } catch (error) {
    log.error(`Failed to retrieve announcements ${error}`);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to retrieve announcements"
    );
  }
}

export async function createAnnouncementAction({
  title,
  message,
  expires_at,
  product_id,
}: {
  title: string;
  message: string;
  expires_at: Date;
  product_id?: string;
}) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  if (!title || !title.trim()) {
    throw new ValidationError("Title is required");
  }
  if (!message || !message.trim()) {
    throw new ValidationError("Message is required");
  }
  if (expires_at.getTime() <= Date.now()) {
    throw new ValidationError("Expiration time must be in the future");
  }

  if (product_id) {
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      select: { shop_id: true, deleted_at: true },
    });
    if (!product || product.deleted_at || product.shop_id !== shopId) {
      throw new ValidationError(
        "Invalid product: Product does not exist or belongs to another shop."
      );
    }
  }

  const announcement = await prisma.shopAnnouncement.create({
    data: {
      shop_id: shopId,
      title: title.trim(),
      message: message.trim(),
      expires_at,
      product_id: product_id || undefined,
    },
  });

  return createSuccessResponse(
    announcement,
    "Announcement published successfully!"
  );
}

export async function deleteAnnouncementAction(id: string) {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  const announcement = await prisma.shopAnnouncement.findUnique({
    where: { id },
  });

  if (!announcement || announcement.shop_id !== shopId) {
    throw new ValidationError("Announcement not found or unauthorized");
  }

  await prisma.shopAnnouncement.delete({
    where: { id },
  });

  return createSuccessResponse(null, "Announcement deleted successfully");
}

export async function getShopAnnouncementsAction() {
  const shopId = await authUtils.getOwnedShopId();
  if (!shopId) {
    throw new UnauthorizedError("Unauthorized: You do not own a shop.");
  }

  const announcements = await prisma.shopAnnouncement.findMany({
    where: {
      shop_id: shopId,
    },
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const serialized = announcements.map((ann) => ({
    id: ann.id,
    title: ann.title,
    message: ann.message,
    expires_at: ann.expires_at.toISOString(),
    created_at: ann.created_at.toISOString(),
    product_name: ann.product?.name || null,
  }));

  return createSuccessResponse(
    serialized,
    "Shop announcements retrieved successfully"
  );
}
