"use server";

import authUtils from "@/lib/utils-functions/auth.utils";
import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.types";
import {
  ShopActionFormData,
  shopActionSchema,
  ShopFormData,
} from "@/validations/shop";

export async function createShopAction(formData: ShopActionFormData) {
  try {
    const user_id = await authUtils.getUserId();
    if (!user_id) {
      throw new Error("User not authenticated");
    }
    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
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
    return createErrorResponse("Failed to create shop.");
  }
}

export async function updateShopAction(formData: ShopFormData) {
  try {
    const shop_id = await authUtils.getShopId();

    if (!shop_id) {
      return createErrorResponse("Unauthorized: You are not a seller.");
    }

    const parsedData = shopActionSchema.safeParse(formData);
    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    await shopRepository.update(shop_id, parsedData.data);

    return createSuccessResponse("Shop updated successfully!");
  } catch (error) {
    console.error("UPDATE SHOP ERROR:", error);
    return createErrorResponse("Failed to update shop.");
  }
}
