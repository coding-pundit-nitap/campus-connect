"use server";

import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils/auth.utils";
import shopRepository from "@/repositories/shop.repository";
import { categoryServices } from "@/services/category";
import { fileUploadService } from "@/services/file-upload";
import { notificationService } from "@/services/notification";
import { createSuccessResponse } from "@/types/response.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";

export async function createShopAction(formData: ShopActionFormData) {
  try {
    const user_id = await authUtils.getUserId();
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
    } = parsedData.data;
    let image_key = "";
    if (image) {
      const imageFile = image;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      image_key = await fileUploadService.upload(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer
      );
    }
    let qr_image_key = "";
    if (qr_image) {
      const qrImageFile = qr_image;
      const buffer = Buffer.from(await qrImageFile.arrayBuffer());
      qr_image_key = await fileUploadService.upload(
        qrImageFile.name,
        qrImageFile.type,
        qrImageFile.size,
        buffer
      );
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
      user: { connect: { id: user_id } },
    });

    return createSuccessResponse(
      newShop,
      "Shop created successfully! Please log out and back in to access the seller dashboard."
    );
  } catch (error) {
    console.error("CREATE SHOP ERROR:", error);
    throw new InternalServerError("Failed to create shop.");
  }
}

export async function updateShopAction(formData: ShopActionFormData) {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true, image_key: true, qr_image_key: true }, // Select old keys for deletion
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
        buffer
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
        buffer
      );

      if (context.qr_image_key) {
        await fileUploadService.deleteFile(context.qr_image_key);
      }
    }

    const updatedShop = await shopRepository.update(shop_id, updateData);

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
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to delete a shop");
    }

    const shop_id = context.id;

    await shopRepository.delete(shop_id);

    return createSuccessResponse(null, "Shop deleted successfully");
  } catch (error) {
    console.error("DELETE SHOP ERROR:", error);
    throw new InternalServerError("Failed to delete shop.");
  }
}
