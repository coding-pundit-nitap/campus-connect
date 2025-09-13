"use server";

import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/custom-error";
import authUtils from "@/lib/utils-functions/auth.utils";
import shopRepository from "@/repositories/shop.repository";
import { createSuccessResponse } from "@/types/response.types";
import {
  ShopActionFormData,
  shopActionSchema,
  ShopFormData,
} from "@/validations/shop";

export async function createShopAction(formData: ShopActionFormData) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new UnauthorizedError("User not authenticated");
    }
    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }

    const newShop = await shopRepository.create({
      ...parsedData.data,
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

export async function updateShopAction(formData: ShopFormData) {
  try {
    const user_id = await authUtils.getUserId();
    const context = await shopRepository.findByOwnerId(user_id, {
      select: { id: true },
    });
    if (!context || !context.id) {
      throw new UnauthorizedError("User is not authorized to create a product");
    }

    const shop_id = context.id;

    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      throw new BadRequestError(parsedData.error.message);
    }

    await shopRepository.update(shop_id, parsedData.data);

    return createSuccessResponse("Shop updated successfully!");
  } catch (error) {
    console.error("UPDATE SHOP ERROR:", error);
    throw new InternalServerError("Failed to update shop.");
  }
}
