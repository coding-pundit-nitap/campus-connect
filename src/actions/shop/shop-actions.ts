"use server";

import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils-functions/auth.utils";
import shopRepository from "@/repositories/shop.repository";
import categoryServices from "@/services/category.service";
import fileUploadService from "@/services/file-upload.service";
import notificationService from "@/services/notification.service";
import { createSuccessResponse } from "@/types/response.types";
import { ShopActionFormData, shopActionSchema } from "@/validations/shop";

export async function createShopAction(formData: ShopActionFormData) {
  try {
    const user_id = await authUtils.getUserId();
    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }
    const { name, description, location, opening, closing, image } =
      parsedData.data;
    let imageKey = "";
    if (image) {
      const imageFile = image;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageKey = await fileUploadService.upload(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer
      );
    }
    const newShop = await shopRepository.create({
      closing,
      description,
      location,
      name,
      opening,
      imageKey,
      owner: { connect: { id: user_id } },
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
      select: { id: true },
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
    let imageKey = "";
    if (values.image) {
      const imageFile = values.image;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageKey = await fileUploadService.upload(
        imageFile.name,
        imageFile.type,
        imageFile.size,
        buffer
      );
    }

    if (imageKey && values.imageKey) {
      await fileUploadService.deleteFile(values.imageKey);
    }

    const { image, ...rest } = values;
    const updatedShop = await shopRepository.update(shop_id, {
      ...rest,
      imageKey,
    });

    await notificationService.publishNotification(user_id, {
      title: "Shop Updated Successfully",
      message: `Your shop ${updatedShop.name} has been updated.`,
      action_url: `/owner-shops`,
      type: "INFO",
    });

    return createSuccessResponse("Shop updated successfully!");

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
