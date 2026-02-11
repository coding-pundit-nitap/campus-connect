"use server";

import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import { prisma } from "@/lib/prisma";
import authUtils from "@/lib/utils/auth.utils.server";
import shopRepository from "@/repositories/shop.repository";
import { categoryServices } from "@/services/category/category.service";
import { fileUploadService } from "@/services/file-upload/file-upload.service";
import { notificationService } from "@/services/notification/notification.service";
import { createSuccessResponse } from "@/types/response.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";

export async function createShopAction(formData: ShopActionFormData) {
  const uploadedFiles: string[] = [];

  try {
    const user = await authUtils.getUserData();
    const user_id = user.id;
    if (!user_id) {
      throw new UnauthorizedError("User is not authorized to create a shop");
    }

    if (user.shop_id) {
      throw new BadRequestError(
        "You already have a shop linked. Update your existing shop instead."
      );
    }

    const existingShop = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (existingShop?.id) {
      throw new BadRequestError(
        "You already have a shop linked. Update your existing shop instead."
      );
    }

    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }
    const {
      name,
      description,
      location,
      opening,
      closing,
      image,
      qr_image,
      upi_id,
      min_order_value,
      batch_slots,
      default_delivery_fee,
      direct_delivery_fee,
    } = parsedData.data;

    let image_key = "";
    if (image) {
      const imageFile = image;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await fileUploadService.uploadOptimizedImage(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer,
        {
          prefix: "shop-images",
        }
      );
      image_key = uploadResult.key;
      uploadedFiles.push(image_key);
    }

    let qr_image_key = "";
    if (qr_image) {
      const qrImageFile = qr_image;
      const buffer = Buffer.from(await qrImageFile.arrayBuffer());
      const uploadResult = await fileUploadService.uploadOptimizedImage(
        qrImageFile.name,
        qrImageFile.type,
        qrImageFile.size,
        buffer,
        {
          prefix: "shop-qr-images",
        }
      );
      qr_image_key = uploadResult.key;
      uploadedFiles.push(qr_image_key);
    }

    const newShop = await shopRepository.create({
      closing,
      description,
      location,
      name,
      opening,
      image_key,
      qr_image_key,
      upi_id,
      min_order_value,
      default_delivery_fee,
      direct_delivery_fee,
      user: { connect: { id: user_id } },
    });

    let batchCardsSaved = true;
    if (batch_slots && batch_slots.length > 0) {
      try {
        await prisma.batchSlot.createMany({
          data: batch_slots.map((card, idx) => ({
            shop_id: newShop.id,
            cutoff_time_minutes: card.cutoff_time_minutes,
            label: card.label?.trim() || null,
            is_active: true,
            sort_order: idx,
          })),
        });
      } catch {
        batchCardsSaved = false;
      }
    }

    return createSuccessResponse(
      newShop,
      batchCardsSaved
        ? "Shop created successfully! Please log out and back in to access the seller dashboard."
        : "Shop created successfully, but batch cards could not be saved (migration pending). The shop will run in direct-delivery mode."
    );
  } catch (error) {
    for (const fileKey of uploadedFiles) {
      try {
        await fileUploadService.deleteFile(fileKey);
      } catch (cleanupError) {
        console.error(
          `Failed to cleanup file ${fileKey} after shop creation failure:`,
          cleanupError
        );
      }
    }

    console.error("CREATE SHOP ERROR:", error);
    if (
      error instanceof BadRequestError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to create shop.");
  }
}

export async function updateShopAction(formData: ShopActionFormData) {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true, image_key: true, qr_image_key: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to update a shop");
    }

    const shop_id = context.id;

    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }

    const values = parsedData.data;
    await categoryServices.cleanupEmptyCategories(shop_id);

    const { image, qr_image, ...rest } = values;

    const updateData: Omit<ShopActionFormData, "image" | "qr_image"> = {
      ...rest,
    };

    if (image) {
      const imageFile = image;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      updateData.image_key = await fileUploadService.upload(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer,
        { prefix: "shop-images" }
      );

      if (context.image_key) {
        await fileUploadService.deleteFile(context.image_key);
      }
    }

    if (qr_image) {
      const qrImageFile = qr_image;
      const buffer = Buffer.from(await qrImageFile.arrayBuffer());
      updateData.qr_image_key = await fileUploadService.upload(
        qrImageFile.name,
        qrImageFile.type,
        qrImageFile.size,
        buffer,
        { prefix: "shop-qr-images" }
      );

      if (context.qr_image_key) {
        await fileUploadService.deleteFile(context.qr_image_key);
      }
    }

    const updatedShop = await shopRepository.update(shop_id, {
      ...updateData,
      batch_slots: {
        deleteMany: {},
        create: values.batch_slots.map((card, idx) => ({
          cutoff_time_minutes: card.cutoff_time_minutes,
          label: card.label?.trim() || null,
          is_active: true,
          sort_order: idx,
        })),
      },
    });

    await notificationService.publishNotification(user_id, {
      title: "Shop Updated Successfully",
      message: `Your shop ${updatedShop.name} has been updated.`,
      action_url: `/owner-shops`,
      type: "INFO",
    });

    return createSuccessResponse(updatedShop, "Shop updated successfully!");
  } catch (error) {
    console.error("UPDATE SHOP ERROR:", error);
    throw new InternalServerError("Failed to update shop.");
  }
}

export async function deleteShopAction() {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: {
        id: true,
        image_key: true,
        qr_image_key: true,
      },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to delete a shop");
    }

    const shop_id = context.id;

    const fileDeletionPromises: Promise<void>[] = [];
    if (context.image_key) {
      fileDeletionPromises.push(
        fileUploadService.deleteFile(context.image_key).catch((err) => {
          console.error(
            `Failed to delete shop image ${context.image_key}:`,
            err
          );
        })
      );
    }
    if (context.qr_image_key) {
      fileDeletionPromises.push(
        fileUploadService.deleteFile(context.qr_image_key).catch((err) => {
          console.error(
            `Failed to delete shop QR image ${context.qr_image_key}:`,
            err
          );
        })
      );
    }
    await Promise.all(fileDeletionPromises);

    await shopRepository.delete(shop_id);

    return createSuccessResponse(null, "Shop deleted successfully");
  } catch (error) {
    console.error("DELETE SHOP ERROR:", error);
    throw new InternalServerError("Failed to delete shop.");
  }
}

export async function toggleAcceptingOrdersAction(acceptingOrders: boolean) {
  try {
    const user = await authUtils.getUserData();
    const user_id = user.id;
    if (!user_id) {
      throw new UnauthorizedError("User is not authorized");
    }

    const shop = await shopRepository.findByOwnerId(user_id, {
      select: { id: true, is_active: true },
    });

    if (!shop) {
      throw new BadRequestError("You don't have a shop to update");
    }

    if (!shop.is_active) {
      throw new BadRequestError(
        "Cannot toggle orders - your shop is deactivated by admin"
      );
    }

    await prisma.shop.update({
      where: { id: shop.id },
      data: { accepting_orders: acceptingOrders },
    });

    return createSuccessResponse(
      { accepting_orders: acceptingOrders },
      acceptingOrders
        ? "Shop is now accepting orders"
        : "Shop is now paused - no new orders will be accepted"
    );
  } catch (error) {
    console.error("TOGGLE ACCEPTING ORDERS ERROR:", error);
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }
    throw new InternalServerError("Failed to toggle order acceptance.");
  }
}
