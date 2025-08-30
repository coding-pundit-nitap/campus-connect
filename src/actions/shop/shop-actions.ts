"use server";

import authUtils from "@/lib/utils/auth.utils";
import shopRepository from "@/repositories/shop.repository";
import {
  createErrorResponse,
  createSuccessResponse,
} from "@/types/response.type";
import { ShopFormData, shopSchema } from "@/validations/shop";

/**
 * Creates a new shop for the authenticated user.
 *
 * This server action validates the provided shop data, authenticates the user,
 * and creates a new shop associated with their account. It ensures that users
 * can only own one shop and validates all input data before creation.
 */
export async function createShopAction(formData: ShopFormData) {
  try {
    await authUtils.isAuthenticated();
    const existingShop = await shopRepository.getShopOwned();
    if (existingShop) {
      return createErrorResponse("You already own a shop");
    }
    const parsedData = shopSchema.safeParse(formData);
    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    const newShop = await shopRepository.createShop(parsedData.data);

    // TODO: revalidate

    return createSuccessResponse(
      newShop,
      "Shop created successfully! Please log out and back in to access the seller dashboard."
    );
  } catch (error) {
    console.error("CREATE SHOP ERROR:", error);
    return createErrorResponse("Failed to create shop.");
  }
}

/**
 * Updates an existing shop's information for the authenticated shop owner.
 *
 * This server action allows shop owners to modify their shop details including
 * name, description, location, and operating hours. It verifies that the user
 * is authenticated as a seller and has permission to update the shop.
 */
export async function updateShopAction(formData: ShopFormData) {
  try {
    const shop_id = await authUtils.getShopId();

    if (!shop_id) {
      return createErrorResponse("Unauthorized: You are not a seller.");
    }

    const parsedData = shopSchema.safeParse(formData);

    if (!parsedData.success) {
      return createErrorResponse(parsedData.error.message);
    }

    await shopRepository.updateShop(shop_id, parsedData.data);

    return createSuccessResponse("Shop updated successfully!");
  } catch (error) {
    console.error("UPDATE SHOP ERROR:", error);
    return createErrorResponse("Failed to update shop.");
  }
}
